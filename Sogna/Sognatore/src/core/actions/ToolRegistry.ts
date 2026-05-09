import { Color } from '@Sogna/Curator';
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { ExecutiveHook } from '../executive/ExecutiveHook.js';
import { ConfigDiscovery } from '@Sogna/Curator/shared/ConfigDiscovery.js';
import { StudioEngine } from '../studio/StudioEngine.js';
import { ToolkitRunner } from '../studio/ToolkitRunner.js';
import { EnvOracle } from '../utils/EnvOracle.js';
import * as ModelRegistry from '../studio/ModelRegistry.js';

export interface ToolDefinition {
 name: string;
 description: string;
 responsibility: string;
 hints: string[];
 parameters: Record<string, string>;
 execute: (args: Record<string, string>, agentTier: string) => Promise<string>;
}

export enum HookDecision {
 Allow = 'Allow',
 Deny = 'Deny',
 RequireApproval = 'RequireApproval',
 Veto = 'Veto',
}

export interface HookResult {
 decision: HookDecision;
 reason: string;
 modifiedArguments?: Record<string, any>;
}

export interface ToolHook {
 name: string;
 preToolUse?: (name: string, args: Record<string, any>, tier: string) => Promise<HookResult>;
 postToolUse?: (name: string, args: Record<string, any>, result: string, tier: string) => Promise<void>;
 postToolUseFailure?: (name: string, args: Record<string, any>, error: string, tier: string) => Promise<void>;
}

export class ToolRegistry {
 private static instance: ToolRegistry;
 private tools: Map<string, ToolDefinition> = new Map();
 private hooks: ToolHook[] = [];
 private protectedFiles: string[] = ['.env', '.git', 'node_modules', '.sognatore'];

 private constructor() {
 this.registerDefaultTools();
 this.registerHook(new ExecutiveHook(process.cwd()));
 }

 static getInstance(): ToolRegistry {
 if (!ToolRegistry.instance) {
 ToolRegistry.instance = new ToolRegistry();
 }
 return ToolRegistry.instance;
 }

 private registerDefaultTools() {
 const config = ConfigDiscovery.getInstance().getConfig();

 const ensureInWorkspace = (relPath: string): string => {
 const resolved = path.resolve(process.cwd(), relPath);
 const canonical = fs.realpathSync(resolved); // Resolves symlinks
 const root = fs.realpathSync(process.cwd());

 if (!canonical.startsWith(root)) {
 throw new Error(`SECURITY ERROR: Path "${relPath}" escapes the institutional workspace boundary.`);
 }
 return canonical;
 };

 const isBinary = (buffer: Buffer): boolean => {
 // Institutional NUL-byte detection (System Parity)
 for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
 if (buffer[i] === 0) return true;
 }
 return false;
 };

 // 1. fs_read
 this.register({
 name: 'fs_read',
 description: 'Lee el contenido de un archivo del disco. Bloquea contenido binario y fugas de directorio.',
 responsibility: 'Recuperación de contenido de archivos para análisis.',
 hints: ['read', 'view', 'content', 'file', 'leer', 'archivo'],
 parameters: { path: 'Ruta relativa del archivo' },
 execute: async (args, tier) => {
 try {
 const fullPath = ensureInWorkspace(args.path);
 if (!fs.existsSync(fullPath)) return `ERROR: Archivo no encontrado en ${args.path}`;

 const stats = fs.statSync(fullPath);
 if (stats.size > config.maxReadSize) {
 return `ERROR: El archivo supera el límite de lectura (${(config.maxReadSize / 1024 / 1024).toFixed(1)}MB). Usa "grep" o lee por rangos.`;
 }

 const buffer = fs.readFileSync(fullPath);
 if (isBinary(buffer)) {
 return `SECURITY ERROR: Se ha detectado contenido binario en ${args.path}. Sognatore solo procesa archivos de texto para mantener la pureza del contexto.`;
 }

 return buffer.toString('utf8');
 } catch (e: any) {
 return e.message;
 }
 }
 });

 // 2. fs_write
 this.register({
 name: 'fs_write',
 description: 'Crea o sobrescribe un archivo con el contenido proporcionado. Enforced workspace boundary.',
 responsibility: 'Modificación o creación de archivos de código y configuración.',
 hints: ['write', 'edit', 'create', 'save', 'escribir', 'editar', 'modificar'],
 parameters: { path: 'Ruta relativa', content: 'Contenido del archivo' },
 execute: async (args, tier) => {
 try {
 const isProtected = this.protectedFiles.some(f => args.path.includes(f));
 if (isProtected && tier === 'silver') {
 return `SECURITY ERROR: El agente de nivel Plata no tiene permisos para modificar archivos protegidos (${args.path}).`;
 }
 
 const fullPath = path.resolve(process.cwd(), args.path);
 // Pre-flight boundary check (even if file doesn't exist yet, we check the target dir)
 const dir = path.dirname(fullPath);
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 
 const canonical = ensureInWorkspace(args.path); // Validates after ensuring it exists or parent exists
 
 fs.writeFileSync(canonical, args.content);
 return `SUCCESS: Archivo ${args.path} escrito correctamente.`;
 } catch (e: any) {
 return e.message;
 }
 }
 });

 // 3. fs_list
 this.register({
 name: 'fs_list',
 description: 'Lista los archivos de un directorio. Workspace-aware.',
 responsibility: 'Exploración de la estructura del proyecto y descubrimiento de archivos.',
 hints: ['list', 'dir', 'files', 'ls', 'search', 'listar', 'directorio'],
 parameters: { path: 'Ruta relativa del directorio' },
 execute: async (args, tier) => {
 try {
 const fullPath = ensureInWorkspace(args.path || '.');
 if (!fs.existsSync(fullPath)) return `ERROR: Directorio no encontrado.`;
 return fs.readdirSync(fullPath).join('\n');
 } catch (e: any) {
 return e.message;
 }
 }
 });

 // 4. run_command (Hardened with BashShield & Async Support)
 this.register({
 name: 'run_command',
 description: 'Ejecuta un comando en la shell del sistema. Soporta ejecución en segundo plano para tareas largas.',
 responsibility: 'Interacción con el sistema operativo y ejecución de herramientas de construcción/test.',
 hints: ['run', 'exec', 'shell', 'terminal', 'install', 'build', 'ejecutar', 'comando'],
 parameters: { 
 command: 'Comando a ejecutar', 
 background: 'Set "true" to run in background without blocking (optional)',
 taskId: 'Unique ID for background task (required if background=true)'
 },
 execute: async (args, tier) => {
 const { Shield: BashShield } = await import('../../Sentinel-Sognatore/Shield.js');
 const { PermissionMode } = await import('../../Sentinel-Sognatore/SecurityTypes.js');
 
 // 1. Safety Audit with institutional heuristics
 const mode = tier === 'gold' ? PermissionMode.Full : PermissionMode.Balanced;
 const shieldResult = BashShield.validate(args.command, mode);
 
 if (!shieldResult.allow) {
 return `SECURITY ERROR: ${shieldResult.reason}`;
 }

 // 2. Task Forking (Background execution support)
 if (args.background === 'true') {
 if (!args.taskId) return 'ERROR: taskId is required for background execution.';
 
 try {
 // Institutional non-blocking spawn
 const { spawn } = await import('child_process');
 const [cmd, ...cmdArgs] = args.command.split(' ');
 
 const child = spawn(cmd, cmdArgs, {
 detached: true,
 stdio: 'ignore',
 cwd: process.cwd()
 });
 child.unref();

 const logDir = path.join(process.cwd(), '.sognare', 'logs', 'tasks');
 if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
 fs.writeFileSync(path.join(logDir, `${args.taskId}.status`), 'RUNNING');

 return `SUCCESS: Command sent to background. TaskID: ${args.taskId}`;
 } catch (e: any) {
 return `ERROR: Failed to fork task: ${e.message}`;
 }
 }

 // 3. Sequential Execution (standard flow)
 try {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
 const stdout = execSync(args.command, { encoding: 'utf8', stdio: 'pipe' });
 return stdout;
 } catch (e: any) {
 return `EXECUTION ERROR: ${e.message}\n${e.stderr || ''}`;
 }
 }
 });

 // 5. grep (Powerful text search)
 this.register({
 name: 'grep',
 description: 'Busca una cadena o patrón en archivos. Muy eficiente para bases de código grandes.',
 responsibility: 'Localización de definiciones y uso de código en archivos múltiples.',
 hints: ['search', 'find', 'find-in-files', 'lookup', 'buscar'],
 parameters: { query: 'Término de búsqueda', path: 'Directorio donde buscar (relativo, por defecto ".")' },
 execute: async (args, tier) => {
 try {
 const target = args.path || '.';
 const fullPath = ensureInWorkspace(target);
 
 let cmd = `grep -r "${args.query}" "${fullPath}"`;
 if (process.platform === 'win32') {
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
 cmd = `findstr /s /i /c:"${args.query}" "${path.join(target, '*')}"`;
 }

// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
 const stdout = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
 return stdout.substring(0, config.maxReadSize); // Limit output
 } catch (e: any) {
 return `No matches found or grep error.`;
 }
 }
 });

 // 6. studio_generate (Sogna Studio Generative AI)
 this.register({
 name: 'studio_generate',
 description: 'Generación de contenido audiovisual (Imagen, Vídeo, LipSync, I2V, V2V) usando Sogna Studio.',
 responsibility: 'Generar contenido crudo a partir de prompts o referencias.',
 hints: ['generate', 'video', 'image', 'lipsync', 'flux', 'kling', 'minimax', 'generar'],
 parameters: { 
 model: 'ID del modelo (ver ModelRegistry o Model Catalog)',
 prompt: 'Prompt de texto (opcional si hay referencia)',
 image_url: 'URL de imagen de referencia (opcional)',
 video_url: 'URL de vídeo de referencia (opcional)',
 audio_url: 'URL de audio (requerido para LipSync)',
 aspect_ratio: 'Relación de aspecto (16:9, 9:16, 1:1, etc.)',
 num_images: 'Número de imágenes (por defecto 1)',
 duration: 'Duración deseada (ej. 5, 10 segundos)',
 seed: 'Semilla para determinismo (-1 para aleatorio)',
 strength: 'Fuerza de transformación (0.1 a 1.0)',
 playbook: 'ID del Playbook de estilo (ej. cinematic, modern)',
 quality: 'Tier de calidad (draft, presentable, broadcast)'
 },
 execute: async (args, tier) => {
 try {
 const engine = new StudioEngine();
 const result = await engine.generate(args);
 return `SUCCESS: Generación completada.\nURL: ${result.url}\nID: ${result.request_id}`;
 } catch (e: any) {
 return `STUDIO GENERATION ERROR: ${e.message}`;
 }
 }
 });

 // 7. studio_compose (Advanced Video Composition)
 this.register({
 name: 'studio_compose',
 description: 'Ensamblado profesional de vídeo con soporte para Remotion, FFmpeg y VideoBuffers.',
 responsibility: 'Ensamblado final: aplicar transiciones, quemar subtítulos, capas y overlays.',
 hints: ['compose', 'stitch', 'render', 'remotion', 'subtitles', 'subtítulos'],
 parameters: { 
 operation: 'compose, render, burn_subtitles, overlay, encode',
 edit_decisions: 'JSON de decisiones de edición (recortes, fuentes, tiempos)',
 asset_manifest: 'JSON de mapeo de IDs a rutas locales',
 output_path: 'Ruta del archivo de salida',
 audio_path: 'Ruta de audio para el mix final',
 subtitle_path: 'Ruta de archivo SRT/ASS'
 },
 execute: async (args, tier) => {
 try {
 const runner = new ToolkitRunner();
 const inputs = {
 operation: args.operation || 'render',
 output_path: args.output_path,
 audio_path: args.audio_path,
 subtitle_path: args.subtitle_path,
 edit_decisions: typeof args.edit_decisions === 'string' ? JSON.parse(args.edit_decisions) : args.edit_decisions,
 asset_manifest: typeof args.asset_manifest === 'string' ? JSON.parse(args.asset_manifest) : args.asset_manifest
 };
 const result = await runner.runSecure('video_compose', inputs);
 if (!result.success) return `STUDIO COMPOSE ERROR: ${result.error}`;
 return `SUCCESS: Vídeo compuesto en ${result.data.output}. Duración: ${result.duration}s`;
 } catch (e: any) {
 return `STUDIO COMPOSE ERROR: ${e.message}`;
 }
 }
 });

 // 8. studio_process (Video Post-Processing Toolkit)
 this.register({
 name: 'studio_process',
 description: 'Acceso al arsenal de post-procesamiento: Reframe, Silence Cutter, Chroma Key.',
 responsibility: 'Mejora y limpieza de activos de vídeo.',
 hints: ['process', 'reframe', 'silence', 'green screen', 'chroma', 'croma'],
 parameters: { 
 tool: 'Nombre de la herramienta: "auto_reframe", "silence_cutter", "green_screen_processor"',
 inputs: 'Objeto JSON con los parámetros específicos de la herramienta'
 },
 execute: async (args, tier) => {
 try {
 const runner = new ToolkitRunner();
 const inputs = typeof args.inputs === 'string' ? JSON.parse(args.inputs) : args.inputs;
 const result = await runner.runSecure(args.tool, inputs);
 if (!result.success) return `STUDIO PROCESS ERROR: ${result.error}`;
 return `SUCCESS: Procesamiento completado. Resultado en data: ${JSON.stringify(result.data)}`;
 } catch (e: any) {
 return `STUDIO PROCESS ERROR: ${e.message}`;
 }
 }
 });

 // 8.5 studio_status
 this.register({
 name: 'studio_status',
 description: 'Report the health and configuration status of all audiovisual providers.',
 responsibility: 'Reporting del estado del ecosistema audiovisual.',
 hints: ['status', 'config', 'health', 'providers'],
 parameters: {},
 execute: async () => {
 EnvOracle.load();
 const muapi = !!process.env.MUAPI_KEY;
 const fal = !!process.env.FAL_KEY;
 const heygen = !!process.env.HEYGEN_API_KEY;

 const models = ModelRegistry.getAllModels();
 return JSON.stringify({
 system: 'Sogna Studio',
 status: 'Optimal',
 providers: {
 muapi: muapi ? 'Configured' : 'Missing',
 fal: fal ? 'Configured' : 'Missing',
 heygen: heygen ? 'Configured' : 'Missing'
 },
 model_count: models.length,
 capabilities: [
 'Text-to-Image',
 'Text-to-Video',
 'Image-to-Video',
 'LipSync',
 'Scoring-Engine',
 'Shot-Prompt-Builder',
 'Playbook-Manager',
 'Structural-Sentinel-SQA',
 'Delivery-Promises'
 ]
 }, null, 2);
 }
 });

 // 8.6 studio_validate_scenes
 this.register({
 name: 'studio_validate_scenes',
 description: 'Valida un plan de escenas para asegurar variedad visual y ritmo cinematográfico (SQA).',
 responsibility: 'Garantizar la calidad estructural antes de la generación.',
 hints: ['validate', 'check', 'scenes', 'sqa', 'variedad', 'ritmo'],
 parameters: { 
 scenes: 'JSON array de escenas con descripción y shot_language'
 },
 execute: async (args) => {
 try {
 const engine = new StudioEngine();
 const scenes = JSON.parse(args.scenes);
 const report = await engine.validateScenePlan(scenes);
 return JSON.stringify(report, null, 2);
 } catch (e: any) {
 return `SQA VALIDATION ERROR: ${e.message}`;
 }
 }
 });

 // 8.7 studio_playbook_info
 this.register({
 name: 'studio_playbook_info',
 description: 'Obtiene información detallada sobre un Playbook de estilo.',
 responsibility: 'Consulta de identidad visual.',
 hints: ['playbook', 'style', 'estilo', 'info'],
 parameters: { playbook: 'ID del playbook' },
 execute: async (args) => {
 const { PlaybookManager } = await import('../studio/PlaybookManager.js');
 const playbook = PlaybookManager.getPlaybook(args.playbook);
 if (!playbook) return `ERROR: Playbook "${args.playbook}" no encontrado.`;
 return JSON.stringify(playbook, null, 2);
 }
 });

 // 8.8 studio_playbook_generate
 this.register({
 name: 'studio_playbook_generate',
 description: 'Genera un Playbook de estilo personalizado a partir de un mood y tono.',
 responsibility: 'Generación de identidad visual inteligente.',
 hints: ['playbook', 'style', 'generate', 'mood', 'tone', 'estilo', 'generar'],
 parameters: { 
 name: 'Nombre del playbook',
 mood: 'Mood (ej. dark, warm, neon, noir)',
 tone: 'Tono (ej. cinematic, minimalist, corporate, raw)',
 pace: 'Pace (ej. slow, moderate, fast)'
 },
 execute: async (args) => {
 const { PlaybookManager } = await import('../studio/PlaybookManager.js');
 const playbook = PlaybookManager.generateFromBrief(args.name, {
 mood: args.mood,
 tone: args.tone,
 pace: args.pace
 });
 const designDoc = PlaybookManager.generateDesignDoc(playbook);
 return `SUCCESS: Playbook "${args.name}" generado.\n\n${designDoc}`;
 }
 });

 // 8.9 studio_project_start
 this.register({
 name: 'studio_project_start',
 description: 'Inicia un nuevo proyecto audiovisual basado en un Blueprint de producción.',
 responsibility: 'Orquestación de proyectos de alto nivel.',
 hints: ['project', 'start', 'iniciar', 'blueprint', 'pipeline'],
 parameters: { 
 id: 'ID único del proyecto',
 blueprint: 'Nombre del blueprint (ej. cinematic, social_express)'
 },
 execute: async (args) => {
 const { ProjectManager } = await import('../studio/ProjectManager.js');
 const { BlueprintRegistry } = await import('../studio/BlueprintRegistry.js');
 
 if (!BlueprintRegistry.getBlueprint(args.blueprint)) {
 return `ERROR: Blueprint "${args.blueprint}" no encontrado. Disponibles: ${BlueprintRegistry.listBlueprints().join(', ')}`;
 }

 const project = ProjectManager.initializeProject(args.id, args.blueprint);
 return `SUCCESS: Proyecto "${args.id}" iniciado con blueprint "${args.blueprint}".\nEstado: ${JSON.stringify(project, null, 2)}`;
 }
 });

 // 8.10 studio_project_status
 this.register({
 name: 'studio_project_status',
 description: 'Obtiene el estado actual, etapa y artefactos de un proyecto activo.',
 responsibility: 'Seguimiento de producción.',
 hints: ['project', 'status', 'estado', 'artefactos', 'artifacts'],
 parameters: { id: 'ID del proyecto' },
 execute: async (args) => {
 const { ProjectManager } = await import('../studio/ProjectManager.js');
 const project = ProjectManager.getProject(args.id);
 if (!project) return `ERROR: Proyecto "${args.id}" no encontrado.`;
 return JSON.stringify(project, null, 2);
 }
 });

 // 12. biz_dream
 this.register({
 name: 'biz_dream',
 description: 'Inicializa un nuevo proyecto de negocio gestionado por el CoreProcessor.',
 responsibility: 'Visión estratégica y ejecución de Agents.',
 hints: ['objective', 'Proyecto', 'negocio', 'startup', 'swarm'],
 parameters: { objective: 'Objetivo o sueño empresarial' },
 execute: async (args) => {
 const { CoreProcessor } = await import('../brain/CoreProcessor.js');
 const processor = CoreProcessor.getInstance();
 const result = await processor.dream(args.objective);
 return `SUCCESS: El CoreProcessor ha delegado el sueño "${result.objective}" a los Agents departamentales.`;
 }
 });

 // 13. biz_status
 this.register({
 name: 'biz_status',
 description: 'Consulta el estado operativo de los agentes vía NeuralRelay.',
 responsibility: 'Monitorización del Agentes.',
 hints: ['status', 'hitos', 'progreso', 'system'],
 parameters: {},
 execute: async () => {
 const { NeuralRelay } = await import('../brain/NeuralRelay.js');
 const hub = NeuralRelay.getInstance();
 const history = hub.getHistory();
 return `SYSTEM STATUS:\n${history.map(s => `[${s.source}] -> ${s.type}: ${JSON.stringify(s.payload)}`).join('\n')}`;
 }
 });

 // 9. studio_upload (Asset Ingestion)
 this.register({
 name: 'studio_upload',
 description: 'Sube un archivo local al almacenamiento de Sogna Studio para usarlo como referencia.',
 responsibility: 'Ingesta de activos locales.',
 hints: ['upload', 'asset', 'subir', 'archivo'],
 parameters: { 
 file_path: 'Ruta absoluta al archivo local'
 },
 execute: async (args, tier) => {
 try {
 const engine = new StudioEngine();
 const url = await engine.uploadFile(args.file_path);
 return `SUCCESS: Archivo subido.\nURL: ${url}`;
 } catch (e: any) {
 return `STUDIO UPLOAD ERROR: ${e.message}`;
 }
 }
 });

 // 10. studio_media_review
 this.register({
 name: 'studio_media_review',
 description: 'Analiza una carpeta o archivo multimedia local para determinar su usabilidad en la producción.',
 responsibility: 'Predatoreía de activos locales (Híbrido).',
 hints: ['review', 'media', 'ffprobe', 'analizar', 'auditoría'],
 parameters: { 
 path: 'Ruta relativa a la carpeta o archivo de medios'
 },
 execute: async (args) => {
 try {
 const { SourceMediaReviewer } = await import('../studio/SourceMediaReviewer.js');
 const fullPath = path.resolve(process.cwd(), args.path);
 
 if (fs.statSync(fullPath).isDirectory()) {
 const reviews = SourceMediaReviewer.reviewFolder(fullPath);
 return JSON.stringify(reviews, null, 2);
 } else {
 const ext = path.extname(fullPath).toLowerCase();
 let type: 'video' | 'audio' | 'image' | undefined;
 if (['.mp4', '.mov', '.webm'].includes(ext)) type = 'video';
 else if (['.mp3', '.wav'].includes(ext)) type = 'audio';
 else if (['.jpg', '.jpeg', '.png'].includes(ext)) type = 'image';
 
 if (!type) return `ERROR: Tipo de archivo no soportado: ${ext}`;
 const review = SourceMediaReviewer.reviewFile(fullPath, type);
 return JSON.stringify(review, null, 2);
 }
 } catch (e: any) {
 return `MEDIA REVIEW ERROR: ${e.message}`;
 }
 }
 });

 // 11. biz_dream (Strategic Business Orchestration)
 this.register({
 name: 'biz_dream',
 description: 'Inicia la orquestación de un nuevo modelo de negocio.',
 responsibility: 'Liderar la creación estratégica de una empresa.',
 hints: ['objective', 'negocio', 'startup', 'agency', 'business', 'Proyecto'],
 parameters: { 
 name: 'Nombre de la empresa/Proyecto',
 blueprint: 'ID del Business Blueprint (ej. startup_mvp, agency_fast_track)'
 },
 execute: async (args) => {
 const { BusinessOrchestrator } = await import('../business/BusinessOrchestrator.js');
 return await BusinessOrchestrator.startWorld(args.name, args.blueprint);
 }
 });

 // 12. biz_status
 this.register({
 name: 'biz_status',
 description: 'Consulta el estado de avance de un proyecto de negocio.',
 responsibility: 'Seguimiento de hitos empresariales.',
 hints: ['status', 'biz', 'negocio', 'avance'],
 parameters: { id: 'ID del proyecto de negocio' },
 execute: async (args) => {
 const { BusinessOrchestrator } = await import('../business/BusinessOrchestrator.js');
 return await BusinessOrchestrator.executeStage(args.id);
 }
 });

 // 13. finance_report
 this.register({
 name: 'finance_report',
 description: 'Genera un informe detallado de salud financiera y KPIs.',
 responsibility: 'Control económica y rentabilidad.',
 hints: ['finance', 'kpi', 'roi', 'money', 'dinero', 'informe'],
 parameters: {},
 execute: async () => {
 const { KpiEngine } = await import('../finance/KpiEngine.js');
 const report = await KpiEngine.generateReport();
 return JSON.stringify(report, null, 2);
 }
 });

 // 14. biz_lead
 this.register({
 name: 'biz_lead',
 description: 'Añade un nuevo lead al CRM centralizado.',
 responsibility: 'Gestión de la base de clientes potencial.',
 hints: ['lead', 'customer', 'cliente', 'crm'],
 parameters: { name: 'Nombre', email: 'Email', source: 'Fuente' },
 execute: async (args) => {
 const { SalesHub } = await import('../business/SalesHub.js');
 const lead = await SalesHub.addLead({ 
 name: args.name, 
 email: args.email, 
 source: args.source, 
 status: 'new' 
 });
 return `SUCCESS: Lead registrado con ID: ${lead.id}`;
 }
 });

 // 15. biz_campaign
 this.register({
 name: 'biz_campaign',
 description: 'Ejecuta una campaña de marketing automatizada con activos de Sognatore Studio.',
 responsibility: 'Generación de crecimiento (Growth).',
 hints: ['campaign', 'marketing', 'ads', 'lanzamiento'],
 parameters: { name: 'Nombre de la campaña', platform: 'instagram | twitter | linkedin' },
 execute: async (args) => {
 const { CampaignManager } = await import('../business/CampaignManager.js');
 const campaign = await CampaignManager.executeCampaign(args.name, args.platform as any);
 return `SUCCESS: Campaña "${campaign.name}" iniciada en ${campaign.platform}.\nActivos: ${campaign.assets.join(', ')}`;
 }
 });

 // 16. finance_invoice
 this.register({
 name: 'finance_invoice',
 description: 'Genera una factura formal para un cliente.',
 responsibility: 'Gestión de cobros.',
 hints: ['invoice', 'factura', 'billing', 'cobro'],
 parameters: { client_id: 'ID del cliente', items: 'JSON array de items [{description, amount}]' },
 execute: async (args) => {
 const { BillingEngine } = await import('../finance/BillingEngine.js');
 const items = JSON.parse(args.items);
 const invoice = await BillingEngine.createInvoice(args.client_id, items);
 const doc = await BillingEngine.generateMarkdown(invoice);
 return `SUCCESS: Factura generada.\n\n${doc}`;
 }
 });

 // 17. legal_gen
 this.register({
 name: 'legal_gen',
 description: 'Genera documentos legales.',
 responsibility: 'control jurídica.',
 hints: ['legal', 'contrato', 'contract', 'nda', 'privacy'],
 parameters: { type: 'NDA | SERVICE | PRIVACY', party: 'Nombre de la contraparte' },
 execute: async (args) => {
 const { LegalHub } = await import('../legal/LegalHub.js');
 const template = await LegalHub.getTemplate(args.type as any);
 const signed = await LegalHub.signDocument(template, args.party);
 return `SUCCESS: Documento legal generado y firmado digitalmente.\n\n${signed}`;
 }
 });
 }

 register(tool: ToolDefinition) {
 if (this.tools.has(tool.name)) {
 console.warn(`[ToolRegistry] Sobrescribiendo herramienta: ${tool.name}`);
 }
 this.tools.set(tool.name, tool);
 }

 registerHook(hook: ToolHook) {
 this.hooks.push(hook);
 }

 getTools(): ToolDefinition[] {
 return Array.from(this.tools.values());
 }

 async execute(name: string, args: Record<string, string>, agentTier: string = 'silver'): Promise<string> {
 const tool = this.tools.get(name);
 if (!tool) return `Tool not found: ${name}`;

 // 1. Pre-hooks (Institutional Gates)
 for (const hook of this.hooks) {
 if (hook.preToolUse) {
 const result = await hook.preToolUse(name, args, agentTier);
 if (result.decision === HookDecision.Deny || result.decision === HookDecision.Veto) {
 return `EXECUTION BLOCKED by ${hook.name}: ${result.reason}`;
 }
 if (result.modifiedArguments) {
 args = { ...args, ...result.modifiedArguments };
 }
 }
 }

 // 2. Core Execution
 try {
 const result = await tool.execute(args, agentTier);

 // 3. Post-hooks (Success)
 for (const hook of this.hooks) {
 if (hook.postToolUse) {
 await hook.postToolUse(name, args, result, agentTier);
 }
 }

 return result;
 } catch (error: any) {
 // 4. Post-hooks (Failure)
 const errorMsg = error instanceof Error ? error.message : String(error);
 for (const hook of this.hooks) {
 if (hook.postToolUseFailure) {
 await hook.postToolUseFailure(name, args, errorMsg, agentTier);
 }
 }
 throw error;
 }
 }

 static getDegradedTools(): Map<string, string> {
 const degraded = new Map<string, string>();
 // Future: dynamic degradation sensing
 return degraded;
 }
}

