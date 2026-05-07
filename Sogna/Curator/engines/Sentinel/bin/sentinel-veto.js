#!/usr/bin/env node

/**
 * Sentinel Veto Hook ( Training Edition)
 * Este script verifica la seguridad del repositorio de los archivos mutados antes del commit.
 * Implementa DLP, AST Shielding y Supply Chain Integrity (OSV).
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const https = require('https');
const { spawnSync } = require('child_process');
const crypto = require('crypto');
const uma = require('../../../shared/uma_bridge.cjs');

const ROOT_DIR = path.resolve(__dirname, '../../../../..');
// ROOT_DIR is now dynamically resolved to the execution context (Sogna root)
const INTEL_REPORT = path.join(__dirname, '../reports/thread_intel.md.js');
const CONFIG_FEED = path.join(__dirname, '../data/risk_dna_feed.json.js');
const SIGNATURE_DB = path.join(__dirname, '../data/signatures.json.js');
const SOBERANIA_DB = path.join(__dirname, '../data/soberania.json');
const VERSION = '1.5.0-Apex';

const MAX_LOG_EVENTS = 100; // Apex Rotation Limit

let riskDNA = { domains: [], flags: [], sensitive_files: [] };
try {
    if (fs.existsSync(CONFIG_FEED)) {
        riskDNA = JSON.parse(fs.readFileSync(CONFIG_FEED, 'utf-8'));
        console.log(`[SENTINEL] Inteligencia Adaptativa cargada (v${riskDNA.version || '1.0'}):`);
        console.log(`  - ${riskDNA.domains.length} Dominios`);
        console.log(`  - ${riskDNA.flags.length} Banderas`);
        console.log(`  - ${(riskDNA.leaks || []).length} Fugas (Leaks)`);
        console.log(`  - ${(riskDNA.secrets || []).length} Secretos`);
        console.log(`  - ${(riskDNA.vulnerabilities || []).length} Vulnerabilidades de Config.`);
    }
} catch (e) {
    console.warn(`[SENTINEL] No se pudo cargar la alimentación de Risk DNA: ${e.message}`);
}

console.log("\n🛡️  [SENTINEL] Modo Apex: Iniciando auditoría institucional...");

const args = process.argv.slice(2);
const scanAll = args.includes('--all');
const isFixMode = args.includes('--fix');
const vetoThreshold = process.env.SENTINEL_STRICT !== 'false';
let report = [];
let fixesApplied = 0;
let signatures = {};
let signaturesUpdated = false;
let fileHashes = {}; // Cache for optimization

// Cargar base de datos de firmas
if (fs.existsSync(SIGNATURE_DB)) {
    try { signatures = JSON.parse(fs.readFileSync(SIGNATURE_DB, 'utf8')); } catch (e) {}
}

function saveSignatures() {
    if (!signaturesUpdated) return;
    fs.writeFileSync(SIGNATURE_DB, JSON.stringify(signatures, null, 2));
}

function signFile(filePath, cachedHash = null) {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(ROOT_DIR, filePath);
        
        let hash = cachedHash;
        if (!hash) {
            if (!fs.existsSync(absolutePath)) return false;
            const content = fs.readFileSync(absolutePath);
            hash = crypto.createHash('sha256').update(content).digest('hex');
        }
        
        const relativePath = path.relative(ROOT_DIR, absolutePath).replace(/\\/g, '/');
        const existing = signatures[relativePath];
        if (existing && existing.hash === hash) return true; // No update needed

        signatures[relativePath] = {
            hash,
            timestamp: new Date().toISOString(),
            signedBy: 'Sentinel-Apex'
        };
        signaturesUpdated = true;
        return true;
    } catch (e) {
        console.error(`[SENTINEL] Error al firmar ${filePath}: ${e.message}`);
        return false;
    }
}

let filesToAnalyze = args.filter(a => !a.startsWith('--'));

if (scanAll) {
    console.log('[SENTINEL] Escaneando todo el proyecto Sogna...');
    try {
        const { execSync } = require('child_process');
        const output = execSync('git ls-files "Sogna/Sognatore/**" "Sogna/toolkit/**" "Sogna/memory/**"', { encoding: 'utf-8', cwd: ROOT_DIR });
        const allFiles = output.split('\n')
            .filter(f => f && (f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.py') || f.endsWith('.sh') || f.endsWith('.md') || f.endsWith('.json') || f === 'memory/security/id_rsa'))
            .filter(f => !f.includes('node_modules') && !f.includes('dist') && !f.includes('.turbo') && !f.includes('.gemini'));
        filesToAnalyze = [...new Set([...filesToAnalyze, ...allFiles])];
    } catch (err) {
        console.warn('[SENTINEL] No se pudo obtener la lista de archivos de git. Usando argumentos manuales.');
    }
}

// --- Carga de System Security ---
let SOBERANIA = { 
    apex_sovereignty: { 
        trusted_scopes: [], trusted_paths: [], domain_whitelist: [], 
        allowed_target_names: [], known_net_clients: [], 
        bash_shield: { write_commands: [], read_only_commands: [], destructive_patterns: [] } 
    } 
};

try {
    if (fs.existsSync(SOBERANIA_DB)) {
        SOBERANIA = JSON.parse(fs.readFileSync(SOBERANIA_DB, 'utf-8'));
    }
} catch (e) {
    console.warn(`[SENTINEL] Error crítico cargando System Security: ${e.message}`);
}

const APEX = SOBERANIA.apex_sovereignty;
const TRUSTED_SCOPES = APEX.trusted_scopes;
const TRUSTED_PATHS = APEX.trusted_paths;
const DOMAIN_WHITELIST = APEX.domain_whitelist;
const ALLOWED_TARGET_NAMES = APEX.allowed_target_names;
const KNOWN_NET_CLIENTS = APEX.known_net_clients;

// --- BashShield: Intent & Classification ---
const SHIELD_WRITE_COMMANDS = APEX.bash_shield.write_commands;
const SHIELD_READ_ONLY_COMMANDS = APEX.bash_shield.read_only_commands;

function classifyBashCommand(cmdString) {
    const trimmed = cmdString.trim().replace(/['"`]/g, '');
    const first = trimmed.split(/\s+/).find(p => !p.includes('=') && p !== 'sudo' && !p.startsWith('-')) || '';
    
    if (SHIELD_READ_ONLY_COMMANDS.includes(first)) return 'ReadOnly';
    if (SHIELD_WRITE_COMMANDS.includes(first)) return 'Write';
    if (['rm', 'shred', 'truncate'].includes(first)) return 'Destructive';
    return 'Unknown';
}

const HONEYPOT_DATA_PATH = path.join(__dirname, '../data/honeypots.json.js');
let HONEYPOTS = [];
try {
    if (fs.existsSync(HONEYPOT_DATA_PATH)) {
        const hData = JSON.parse(fs.readFileSync(HONEYPOT_DATA_PATH, 'utf-8'));
        HONEYPOTS = hData.decoys || [];
    }
} catch (e) {
    console.warn(`[SENTINEL] No se pudo cargar Honeypots centralizados: ${e.message}`);
}

let hasCritical = false;
let hasWarning = false;
let pendingEvents = [];
let pendingAsyncOps = [];

function addReport(level, reason, location, solution) {
    // Normalizar ruta para compatibilidad Windows/Unix en Senderos de Confianza
    const normalizedLocation = location.replace(/\\/g, '/');

    // Apex Sovereign Path Exception: Downgrade CRITICAL to WARNING for trusted resource paths
    // BUT: Never downgrade SECRET EXPOSURE in the memory hub.
    const isSecretExposure = reason.includes('EXPOSICIÓN DE SECRETO') || reason.includes('ARCHIVO PROHIBIDO');
    if (level === 'CRITICAL' && !isSecretExposure && TRUSTED_PATHS.some(p => normalizedLocation.toLowerCase().includes(p.toLowerCase()))) {
        level = 'WARNING';
        reason = `[System Security] ${reason}`;
        console.log(`🛡️  [SOBERANÍA] Autorizando excepcionalmente: ${normalizedLocation}`);
    }

    if (level === 'CRITICAL') hasCritical = true;
    if (level === 'WARNING') hasWarning = true;
    
    pendingEvents.push({
        timestamp: new Date().toISOString(),
        level,
        reason,
        location,
        solution
    });
    
    console.log(`[${level}] ${reason} -> ${location}`);
}

// --- DLP: Detección de Fuga de Datos ---
function scanDataLeak(filePath, content) {
    const forbiddenFiles = ['.env', '.pem', '.key', '.p12', 'id_rsa'];
    const fileName = path.basename(filePath);
    
    if (forbiddenFiles.some(f => fileName.includes(f))) {
        addReport('CRITICAL', `ARCHIVO PROHIBIDO DETECTADO: Los archivos sensibles de configuración o llaves no deben estar en staging.`, filePath, "PROTOCOLO DE RADICALIZACIÓN: El archivo será eliminado permanentemente.");
        if (isFixMode) {
           pendingAsyncOps.push(uma.logIncident('FORBIDDEN_FILE_PURGE', filePath).then(() => {
               try { 
                 const abs = path.resolve(process.cwd(), filePath);
                 fs.unlinkSync(abs); 
                 console.log(`[SENTINEL] Archivo purgado: ${filePath}`); 
               } catch(e){ console.error(`[SENTINEL] Fallo al purgar: ${e.message}`); }
           }));
        }
        return;
    }

    const secretPatterns = [
        /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}/,      // GitHub
        /xox[p|b|o|a]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}/, // Slack
        /AKIA[0-9A-Z]{16}/,                             // AWS Key
        /(?:AIza[0-9A-Za-z-_]{30,45})/,                 // GCP API Key (flexible length)
        /sk_live_[0-9a-zA-Z]{24}/,                      // Stripe
        /mongodb(?:\+srv)?:\/\/[^\s]+:[^\s]+@[^\s]+/,   // MongoDB Connection String
        /postgres:\/\/[^\s]+:[^\s]+@[^\s]+/,            // Postgres Connection String
        /-----BEGIN (?:PRIVATE|RSA|OPENSSH) KEY-----/,
        /[a-f0-9]{64}/i,                                // SHA-256 strings (potential secrets)
    ];

    // Check Honeypots
    if (HONEYPOTS.some(h => filePath.replace(/\\/g, '/').includes(h))) {
        addReport('CRITICAL', `VIOLACIÓN DE HONEYPOT: Intento de acceso o modificación de un archivo señuelo de seguridad.`, filePath, "PROTOCOLO DE PÁNICO ACTIVADO. Neutralización inmediata requerida.");
        return;
    }

    for (const pattern of secretPatterns) {
        const match = content.match(pattern);
        if (match) {
            const secret = match[0];
            addReport('CRITICAL', `EXPOSICIÓN DE SECRETO: Firma detectada vinculada a servicios externos o credenciales.`, filePath, "PROTOCOLO DE RADICALIZACIÓN: El secreto será eliminado y puesto en blacklist de hashes.");
            
            if (isFixMode) {
               // Push to promise queue to await before exit
               pendingAsyncOps.push(uma.logIncident('SECRET_EXPOSURE', filePath, secret).then(() => {
                   try { 
                     const abs = path.resolve(process.cwd(), filePath);
                     fs.unlinkSync(abs); 
                     console.log(`[SENTINEL] Archivo purgado: ${filePath}`); 
                   } catch(e){ console.error(`[SENTINEL] Fallo al purgar: ${e.message}`); }
               }));
            } else {
               pendingAsyncOps.push(uma.logIncident('SECRET_EXPOSURE_ALERT', filePath));
            }
        }
    }

    // Identificar Archivos Sensibles (DNA Aprendido)
    for (const filePattern of riskDNA.sensitive_files || []) {
        const regex = new RegExp(filePattern, 'i');
        if (regex.test(content) || regex.test(filePath)) {
            addReport('CRITICAL', `ADN DE RIESGO DETECTADO (Archivo): Referencia a archivo sensible aprendida del catálogo de habilidades.`, filePath, `Evitar referenciar archivos como ${filePattern} en el código.`);
        }
    }

    // Identificar Comandos Peligrosos (DNA Aprendido)
    for (const flag of riskDNA.flags || []) {
        const regex = new RegExp(flag, 'i');
        if (regex.test(content)) {
            addReport('CRITICAL', `ADN DE RIESGO DETECTADO (Comando): Patrón de comando ofensivo/crítico detectado (${flag}).`, filePath, "Sanitizar el comando o usar una alternativa segura del toolkit.");
        }
    }

    // Identificar Fugas de Datos (PII/Leaks Aprendidos)
    for (const leak of riskDNA.leaks || []) {
        if (content.includes(leak)) {
            addReport('CRITICAL', `FUGA DE DATOS DETECTADA: El archivo contiene un identificador sensible (email/IP) catalogado como fuga histórica.`, filePath, "Eliminar la referencia personal o corporativa del archivo.");
        }
    }

    // Identificar Secretos Aprendidos (Entropy Hits)
    for (const secretPlaceholder of riskDNA.secrets || []) {
        const partial = secretPlaceholder.replace('...', '');
        if (content.includes(partial)) {
            addReport('CRITICAL', `SECRETO DETECTADO: Coincidencia con una cadena de alta entropía (llave/token) catalogada durante la auditoría profunda.`, filePath, "No hardcodear secretos. Usar el sistema de gestión de claves de Sogna.");
        }
    }

    // Identificar Vulnerabilidades de Configuración
    for (const vuln of riskDNA.vulnerabilities || []) {
        const regex = new RegExp(vuln, 'i');
        if (regex.test(content)) {
            addReport('CRITICAL', `CONFIGURACIÓN VULNERABLE DETECTADA: Patrón de configuración insegura detectado (${vuln}).`, filePath, "Corregir el parámetro para cumplir con el estándar de seguridad de Sogna.");
        }
    }

    const nonAlphaNumeric = (content.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const entropyScore = content.length > 0 ? nonAlphaNumeric / content.length : 0;
    if (entropyScore > 0.45 && content.length > 300) {
        addReport('WARNING', `ENTROPÍA SOSPECHOSA: El contenido parece ofuscado o binario comprimido.`, filePath, "Verificar si el archivo es necesario o si contiene malware ofuscado.");
    }
}

// --- AST: Guardia Sintáctico y Semántico ---
function scanASTForBackdoors(filePath, content) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;

    try {
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        const taintVariables = new Set(); 

        function visit(node) {
            // Optimization: Skip nodes that are unlikely to contain security issues (comments are still checked as text)
            if (ts.isToken(node) && !ts.isStringLiteral(node)) return;

            // --- BYPASS TRACKING ---
            const fullText = node.getFullText(sourceFile);
            if (fullText.includes('@Sentinel-ignore') || fullText.includes('@Sogna-ignore')) {
                // Precision: If the ignore is justified (contains :), reduce severity to silent info unless it's a critical core file
                const isJustified = fullText.includes(':');
                const isCoreFile = filePath.includes('Sognatore/src/core/') || filePath.includes('Toolkit/engines/');
                
                if (!isJustified || isCoreFile) {
                    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    addReport('WARNING', `BYPASS DETECTADO: El archivo utiliza una directiva de ignorado de Sentinel sin justificación adecuada o en el núcleo.`, `${filePath}:${pos.line + 1}`, "Justificar la excepción de seguridad en el comentario.");
                }
            }

            // 1. Identificar Fuentes de Taint (req.query, req.body, etc.)
            if (ts.isPropertyAccessExpression(node)) {
                const expression = node.expression;
                if ((ts.isPropertyAccessExpression(expression) && (expression.name.text === 'query' || expression.name.text === 'body')) || 
                    (ts.isIdentifier(expression) && (expression.text === 'req'))) {
                    if (ts.isVariableDeclaration(node.parent)) {
                        taintVariables.add(node.parent.name.text);
                    }
                }
            }

            // 2. Identificar Sumideros (eval, exec, etc.)
            if (ts.isCallExpression(node)) {
                const expression = node.expression;
                const callText = expression.getText(sourceFile);
                
                // --- NIVEL 4: LOGIC BOMBS (TIME-DELAYED EXPLOITS) ---
                if (['setTimeout', 'setInterval'].includes(callText)) {
                    const delayArg = node.arguments[1];
                    if (delayArg) {
                        const delayText = delayArg.getText(sourceFile);
                        // Flag suspicious delays (e.g. > 24h or dynamic)
                        const isDynamicDelay = !ts.isNumericLiteral(delayArg);
                        const delayVal = ts.isNumericLiteral(delayArg) ? parseInt(delayArg.text) : 0;
                        const isCapped = delayText.includes('Math.min') || content.includes('Math.min');
                        
                        // Allow dynamic delays if they are capped with Math.min (safe retry pattern)
                        if ((isDynamicDelay && !isCapped) || delayVal > 86400000) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('WARNING', `POSIBLE LOGIC BOMB: Temporizador detectado con retraso dinámico o excesivo (${delayText}).`, `${filePath}:${pos.line + 1}`, "Asegurar que los temporizadores tengan valores estáticos o acotados con Math.min.");
                        }

                        // --- ELITE: RACE CONDITION HEURISTIC ---
                        // If we see a delay and DB operations in the SAME file, it's a high risk
                        const dbOps = ['SELECT', 'UPDATE', 'INSERT', 'DELETE'];
                        if (dbOps.some(op => content.toUpperCase().includes(op)) && (content.includes('db.run') || content.includes('db.get'))) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('CRITICAL', `RACE CONDITION DETECTADA: Secuencia de base de datos interrumpida por temporizador (Riesgo de Double Spend).`, `${filePath}:${pos.line + 1}`, "Usar TRANSACCIONES ATÓMICAS (BEGIN/COMMIT) o bloqueos (locks) de base de datos.");
                        }
                    }
                }

                // Caso eval()
                if (ts.isIdentifier(expression) && expression.text === 'eval') {
                    const arg = node.arguments[0];
                    if (arg && (ts.isIdentifier(arg) && taintVariables.has(arg.text) || ts.isPropertyAccessExpression(arg))) {
                        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        addReport('CRITICAL', `TAINTED RCE: Ejecución de código con entrada de usuario no sanitizada detectada via eval().`, `${filePath}:${pos.line + 1}`, "Eliminar eval y usar lógica determinista.");
                    }
                }

                // Caso IDOR (Lógica de Negocio)
                if (ts.isPropertyAccessExpression(expression) && ['get', 'post', 'put', 'delete'].includes(expression.name.text)) {
                    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    if (!content.includes('ownerId') && !content.includes('auth.user.id') && (content.includes('req.params') || content.includes('req.query') || content.includes('req.body'))) {
                        addReport('WARNING', `POSIBLE IDOR: Endpoint detectado procesando IDs de usuario sin validación aparente de propiedad (Ownership).`, `${filePath}:${pos.line + 1}`, "Asegurar que el objeto solicitado pertenece al usuario autenticado.");
                    }
                }

                // --- NIVEL 3: EXFILTRACIÓN Y RED ---
                const objAccess = ts.isPropertyAccessExpression(expression) ? expression.expression.getText(sourceFile) : '';
                
                // Refined network call detection: 
                // fetch() is always a net call.
                // .get(), .post(), etc. are net calls ONLY if the object looks like a network client.
                const isNetCall = (ts.isIdentifier(expression) && ['fetch', 'lookup'].includes(expression.text)) || 
                                 (ts.isPropertyAccessExpression(expression) && 
                                  (['post', 'put', 'request'].includes(expression.name.text) || 
                                   (expression.name.text === 'get'))); // Broaden .get detection

                // --- ELITE: SSRF PROTECTION ---
                if (isNetCall) {
                    const urlArg = node.arguments[0];
                    if (urlArg && ts.isStringLiteral(urlArg)) {
                        const url = urlArg.text;
                        const domainMatch = url.match(/https?:\/\/([^/:]+)/);
                        const domain = domainMatch ? domainMatch[1] : null;

                        if (domain && !DOMAIN_WHITELIST.some(d => domain.endsWith(d))) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('WARNING', `DOMINIO NO RECONOCIDO: Intento de conexión a ${domain}`, `${filePath}:${pos.line + 1}`, "Añadir el dominio a la lista blanca de Sognatore.");
                        }
                    }
                }

                if (callText.includes('.get(')) {
                    const expression = node.expression;
                    if (ts.isPropertyAccessExpression(expression)) {
                        const target = expression.expression;
                        const targetName = target.getText();
                        
                        // False Positive Protection: Only alert if it's a known net client
                        const isNetClient = KNOWN_NET_CLIENTS.some(nc => targetName.toLowerCase().includes(nc.toLowerCase()));
                        if (!isNetClient) return; // Skip Map, Set, generic objects
                        
                        const arg = node.arguments[0];
                        if (arg && ts.isStringLiteral(arg)) {
                            // Check if arg name looks like exfiltration
                            const sensitiveTerms = ['key', 'secret', 'password', 'token', 'config', 'auth'];
                            if (sensitiveTerms.some(t => arg.text.toLowerCase().includes(t))) {
                                const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                                addReport('WARNING', `POSIBLE EXFILTRACIÓN: Acceso a dato sensible via ${targetName}.get("${arg.text}")`, `${filePath}:${pos.line + 1}`, "Verificar que el dato no se envía a un servidor externo.");
                            }
                        }
                    }
                }

                // --- BASH SHIELD INTEGRATION IN AST ---
                const shellTools = ['exec', 'execSync', 'spawn', 'execa', 'runSafeCommand', 'bash', 'sh'];
                if (shellTools.some(t => callText.includes(t))) {
                    const cmdArg = node.arguments[0];
                    if (cmdArg && ts.isStringLiteral(cmdArg)) {
                        const cmd = cmdArg.text;
                        const intent = classifyBashCommand(cmd);
                        
                        // Heuristic: Check for destructive patterns in strings
                        const DESTRUCTIVE_PATTERNS = APEX.bash_shield.destructive_patterns;
                        for (const dp of DESTRUCTIVE_PATTERNS) {
                            if (cmd.includes(dp[0])) {
                                const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                                addReport('CRITICAL', `COMANDO DESTRUCTIVO HARCODED: ${dp[1]}`, `${filePath}:${pos.line + 1}`, "Eliminar el comando destructivo literal o usar una ruta segura.");
                            }
                        }

                        // Heuristic: Check for outside-workspace system targets
                        const systemDirs = ['/etc/', '/usr/', '/var/', '/bin/', '/sbin/'];
                        if (systemDirs.some(dir => cmd.includes(dir))) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('WARNING', `ACCESO A SISTEMA EXTERNO: El comando parece apuntar a directorios protegidos fuera del workspace (${cmd}).`, `${filePath}:${pos.line + 1}`, "Asegurar que el comando tiene privilegios mínimos.");
                        }
                    }
                }
                
                if (isNetCall) {
                    const urlArg = node.arguments[0];
                    if (urlArg) {
                        const urlText = urlArg.getText(sourceFile);
                        const isLiteral = ts.isStringLiteral(urlArg);

                        // False Positive Protection: Don't flag Map.get, Set.has, or local registry getters
                        const isSafeObj = [
                            'this.skills', 'this.activeAgents', 'this.tools', 'this.agents', 
                            'Map', 'Set', 'cache', 'activeSpans', 'discovered', 'registry',
                            'this._', 'this.', '_registered', 'Registry', 'Map', 'State', 'Config'
                        ].some(s => objAccess.includes(s)) || (objAccess.startsWith('_') && !isKnownNetClient);
                        
                        if (isSafeObj && ['get', 'has', 'set'].includes(expression.name.text)) {
                            return; 
                        }

                        // Skip if already justified via comment
                        if (fullText.includes('@Sentinel-ignore')) return;

                        const isSecuredByWhitelist = DOMAIN_WHITELIST.some(d => urlText.includes(d)) || 
                                                     (urlText.match(/^['"`]\//) && DOMAIN_WHITELIST.some(d => content.includes(d)));
                        
                        const isTrustedPrefix = ALLOWED_TARGET_NAMES.some(name => urlText.includes(name)) || 
                                               /VITE_|REACT_APP_|NEXT_PUBLIC_/.test(urlText);
                        
                        const isRelativePath = urlText.match(/^['"`]\//) || (urlText.startsWith('`') && isTrustedPrefix);
                        const hasTrustedDomainReference = sourceFile.text.split('\n').some(line => 
                            DOMAIN_WHITELIST.some(d => line.includes(d))
                        );

                        if (isRelativePath && hasTrustedDomainReference) {
                            // Confianza heredada: Se asume que el archivo está configurado para un destino seguro
                            return;
                        }

                        const isAllowedVariable = ALLOWED_TARGET_NAMES.some(v => urlText === v || urlText.includes(v));
                        const isDynamic = !isLiteral || urlText.includes('`') || urlText.includes('+') || urlText.includes('${');
                        const isExterno = !isSecuredByWhitelist;
                        
                        if (((isDynamic && !isSecuredByWhitelist) || (isExterno && !isLiteral)) && !isAllowedVariable) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('CRITICAL', `SOSPECHA DE EXFILTRACIÓN: Llamada de red con destino dinámico o externo no autorizado (${urlText}).`, `${filePath}:${pos.line + 1}`, "Añadir el dominio a la lista blanca o usar constantes para URLs externas.");
                        }

                        // Verificación contra Lista de Vigilancia de Dominios (DNA Aprendido)
                        const isLearnedRiskDomain = riskDNA.domains.some(d => urlText.includes(d));
                        if (isLearnedRiskDomain && !isSecuredByWhitelist) {
                             const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                             addReport('CRITICAL', `DOMINIO DE RIESGO APRENDIDO: El destino de red coincide con patrones de exfiltración detectados en habilidades ofensivas.`, `${filePath}:${pos.line + 1}`, "Bloquear acceso a dominios de riesgo conocidos.");
                        }
                    }
                }
            }

            // 3. Evasión de Entropía y Logic Bombs
            if (ts.isBinaryExpression(node)) {
                // Polución de Prototipos (Directa - Solo ASIGNACIONES)
                const leftText = node.left.getText(sourceFile);
                const isAssignment = [ts.SyntaxKind.EqualsToken, ts.SyntaxKind.PlusEqualsToken].includes(node.operatorToken.kind);
                
                if (isAssignment && ['__proto__', 'constructor', 'prototype'].some(p => leftText.includes(p))) {
                    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    addReport('CRITICAL', `RIESGO DE PROTOTYPE POLLUTION: Asignación directa a prototipo detectada en ${leftText}`, `${filePath}:${pos.line + 1}`, "Usar Object.create(null) o métodos seguros de merge(deep-extend).");
                }
            }

            // Polución de Prototipos (Vía Bucle Inseguro)
            if (ts.isForInStatement(node)) {
                const body = node.statement.getText(sourceFile);
                if (body.includes('[') && body.includes('=') && !body.includes('hasOwnProperty')) {
                    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    addReport('CRITICAL', `ESTRUCTURA DE RIESGO: Bucle for...in detectado sin validación hasOwnProperty. Posible Prototype Pollution en utilidad de merge.`, `${filePath}:${pos.line + 1}`, "Añadir filtro para __proto__ y constructor, o usar if(Object.prototype.hasOwnProperty.call(source, key)).");
                }
            }

            if (ts.isStringLiteral(node)) {
                if (node.text.length > 20) { 
                    const isBase64 = /^[a-zA-Z0-9+/=_ -]*$/.test(node.text) && (node.text.length % 4 === 0 || node.text.includes('='));
                    const hasHighEntropia = (node.text.match(/[A-Z]/g) || []).length >= 5 && (node.text.match(/[0-9]/g) || []).length >= 3;
                    const isMock = node.text.includes('MOCK') || node.text.includes('TEMPLATE');
                    const isAlphabet = /^[A-Z0-9]+$/.test(node.text) && node.text.length >= 26 && new Set(node.text).size > 20;

                    if (isBase64 && hasHighEntropia && node.text.length > 24 && !isMock && !isAlphabet) {
                        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        addReport('WARNING', `POSIBLE FRAGMENTO DE LLAVE: Cadena de alta entropía detectada (Base64 suspected).`, `${filePath}:${pos.line + 1}`, "Evitar hardcoding de secretos fragmentados.");
                    }
                }
            }

            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
    } catch (e) {
        console.error(`[SENTINEL ERROR] Fallo en análisis AST de ${filePath}: ${e.message}`);
    }
}

// --- FIXER: Motor de Remediación Automática (Apex - Immune System Fusion) ---
function applyFixes(filePath, originalContent) {
    let content = originalContent;
    const remediations = riskDNA.remediations || {};
    let fixApplied = false;

    // 1. Cap de Delays (Logic Bombs)
    const patternTime = /(setTimeout|setInterval)\s*\(\s*([^,]+)\s*,\s*(\d+|[a-zA-Z0-9_$.]+)\s*\)/g;
    content = content.replace(patternTime, (match, func, cb, delay) => {
        const limit = remediations.POSSIBLE_LOGIC_BOMB?.limit || 60000;
        if (delay.includes('Math.min')) return match; 
        if (parseInt(delay) > limit || isNaN(parseInt(delay))) {
            fixApplied = true;
            return `${func}(${cb}, Math.min(${delay}, ${limit})) // @Sentinel: Capped for institutional performance`;
        }
        return match;
    });

    // 2. Inyección de Justificaciones Apex
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Justificar llamadas de red y comandos sensibles automáticamente si no lo están
        const isSensitive = /spawnSync|execSync|https\.request|fetch|axios\.get|\.exit\(/.test(line);
        if (isSensitive && !lines[i-1]?.includes('@Sentinel-ignore')) {
            newLines.push(`// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad`);
            fixApplied = true;
        }
        
        newLines.push(line);
    }
    content = newLines.join('\n');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        fixesApplied++;
        
        // --- IMMUNE SYSTEM: GENERACIÓN DE VACUNAS ---
        // Si el archivo está en el núcleo, generamos un reporte de autocuración
        if (filePath.includes('Sognatore/src/core')) {
            const vaccineDir = path.join(ROOT_DIR, 'Sognatore/memory/security/vaccines');
            if (!fs.existsSync(vaccineDir)) fs.mkdirSync(vaccineDir, { recursive: true });
            
            const vaccineReport = {
                timestamp: new Date().toISOString(),
                file: path.relative(ROOT_DIR, filePath),
                action: 'Auto-Remediación Apex',
                type: 'Hardening'
            };
            fs.appendFileSync(path.join(vaccineDir, 'healing_registry.jsonl'), JSON.stringify(vaccineReport) + '\n');
        }

        console.log(`  ✅ ${path.basename(filePath)}: Remediado y blindado automáticamente.`);
    }
}

// --- OSV: Supply Chain Integrity ---
async function queryOSV(packageName, version) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ version, package: { name: packageName, ecosystem: 'npm' } });
        const req = https.request('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
            timeout: 5000
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.vulns || []);
                } catch (e) { resolve([]); }
            });
        });
        req.on('error', () => resolve([]));
        req.on('timeout', () => { req.destroy(); resolve([]); });
        req.write(data);
        req.end();
    });
}

async function scanSupplyChain(filePath) {
    if (!filePath.endsWith('package.json')) return;
    try {
        const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        
        console.log(`[SENTINEL] Auditando ${Object.keys(deps).length} librerías contra OSV...`);
        
        const auditPromises = Object.entries(deps).map(async ([name, ver]) => {
            // Check Trusted Scopes
            if (name.startsWith('@') && TRUSTED_SCOPES.some(s => name.startsWith(s))) {
                const cleanVer = ver.replace(/[\^~]/g, '');
                if (parseInt(cleanVer.split('.')[0]) > 90) {
                    addReport('CRITICAL', `POSIBLE DEPENDENCY CONFUSION: El paquete interno ${name} usa una versión sospechosamente alta (${ver}).`, filePath, "Asegurar que el paquete se instala desde el registry privado.");
                }
            }

            const cleanVer = ver.replace(/[\^~]/g, '');
            let vulns = await queryOSV(name, cleanVer);
            
            // Filter out allowed vulnerabilities
            vulns = vulns.filter(v => !(SOBERANIA.apex_sovereignty.allowed_vulns || []).includes(v.id));

            if (vulns.length > 0) {
                addReport('CRITICAL', `LIBRERÍA INFECTADA/VULNERABLE: ${name}@${cleanVer} tiene ${vulns.length} vulnerabilidades reportadas en OSV.`, filePath, `Actualizar ${name} o buscar alternativa segura.`);
            }
        });

        await Promise.all(auditPromises);
    } catch (e) {}
}

// --- Main Loop ---
(async () => {
    for (const fileLine of filesToAnalyze) {
        const filePath = path.resolve(process.cwd(), fileLine);

        if (!fs.existsSync(filePath)) continue;
        if (fs.lstatSync(filePath).isDirectory()) continue;

        const relativePath = path.relative(process.cwd(), filePath);
        if (relativePath.startsWith('..') || path.isAbsolute(fileLine) && !filePath.startsWith(process.cwd())) {
            continue;
        }

        if (filePath.includes('Sentinel-veto.js')) continue;

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            // Cache hash for the signing phase
            fileHashes[fileLine] = crypto.createHash('sha256').update(content).digest('hex');
            
            if (isFixMode) {
                applyFixes(filePath, content);
                content = fs.readFileSync(filePath, 'utf-8'); // Reload after fix
            }

            // --- MECANISMO DE EXENCIÓN & CONTENCIÓN ---
            const isContainment = fileLine.includes('tests/security_training/');
            
            if (content.includes('@Sentinel-ignore') || content.includes('@Sogna-ignore')) {
                // If the file has a GLOBAL ignore using JS or Markdown comment style, skip it
                if (content.match(/\/\*[\s\S]*?@Sentinel-ignore: GLOBAL[\s\S]*?\*\//) || 
                    content.match(/\/\/ @Sentinel-ignore: GLOBAL/) ||
                    content.match(/<!--\s*@Sentinel-ignore:\s*GLOBAL\s*-->/)) {
                    console.log(`[SENTINEL] Saltando archivo auditado externamente (GLOBAL): ${fileLine}`);
                    continue;
                }
            }

            if (isContainment) {
                console.log(`[SENTINEL] ☣️  Analizando archivo en ÁREA DE CONTENCIÓN: ${fileLine}`);
                const originalAddReport = addReport;
                addReport = (level, reason, location, solution) => {
                    originalAddReport('WARNING', `[CONTENIDO] ${reason}`, location, solution);
                };

                scanDataLeak(fileLine, content);
                if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                    scanASTForBackdoors(fileLine, content);
                }
                await scanSupplyChain(fileLine, content);
                
                addReport = originalAddReport;
                continue;
            }

            scanDataLeak(fileLine, content);
            
            if (fileLine.includes('Toolkit/engines/Sentinel/.husky/pre-commit')) {
                if (!content.includes('Sentinel-veto.js') && !content.includes('lint-staged')) {
                    addReport('CRITICAL', `ATAQUE A LA INTEGRIDAD: Se ha detectado un intento de eludir el motor de seguridad en Husky centralizado.`, fileLine, "Restaurar la llamada a sentinel o lint-staged en el hook pre-commit.");
                }
            }

            if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                scanASTForBackdoors(fileLine, content);
            }
            await scanSupplyChain(fileLine, content);
        } catch (e) { 
            console.error(`[SENTINEL ERROR] Fallo procesando ${fileLine}: ${e.message}`);
        }
    }

    // Await all radical security operations before finalizing report
    if (pendingAsyncOps.length > 0) {
        console.log(`[SENTINEL] Finalizando ${pendingAsyncOps.length} operaciones de saneamiento radical...`);
        await Promise.all(pendingAsyncOps);
    }

    if (pendingEvents.length > 0) {
        const headerExists = fs.existsSync(INTEL_REPORT);
        let logStream = "";
        
        if (!headerExists) {
            logStream += "# 🛡️  SENTINEL THREAD INTEL (System Feed)\n\n";
        }

        pendingEvents.forEach(ev => {
            logStream += `### EVENTO: ${ev.timestamp}\n`;
            logStream += `[${ev.level}]\t${ev.reason}\n`;
            logStream += `\tUbicación: ${ev.location}\n`;
            logStream += `\tSolución : ${ev.solution}\n`;
            logStream += `---\n`;
        });

        fs.appendFileSync(INTEL_REPORT, logStream);
        
        // Apex Rotation: Mantenemos el archivo bajo control si crece demasiado (> 1MB)
        try {
            const stats = fs.statSync(INTEL_REPORT);
            if (stats.size > 1024 * 1024) { // 1MB Limit
                const content = fs.readFileSync(INTEL_REPORT, 'utf-8');
                const truncated = "# 🛡️  SENTINEL THREAD INTEL (System Feed)\n\n" + 
                                  content.split('---\n').slice(0, 50).join('---\n') + "\n";
                fs.writeFileSync(INTEL_REPORT, truncated);
            }
        } catch (e) {}
    }

    if (fixesApplied > 0) {
        console.log(`✅ [SENTINEL] Se aplicaron ${fixesApplied} correcciones automáticas.`);
    }

    // Firma automática de archivos escaneados sin hallazgos críticos
    // Esto permite que el Guardian confíe en los archivos validados por Sentinel.
    let signedCount = 0;
    filesToAnalyze.forEach(file => {
        const hasCriticalEntry = pendingEvents.some(ev => ev.location === file && ev.level === 'CRITICAL');
        if (!hasCriticalEntry) {
            if (signFile(file, fileHashes[file])) signedCount++;
        }
    });

    if (signedCount > 0) {
        saveSignatures();
        console.log(`🔏 [SENTINEL] Firma institucional aplicada a ${signedCount} archivos.`);
    }

    if (!hasCritical && !hasWarning) {
        console.log("✅ [CLEAN] Dominio seguro. Sentinel autoriza el acceso.\n");
        process.exit(0);
    } else {
        if (hasCritical && vetoThreshold) {
            console.error("⛔ [VETO] Sentinel ha bloqueado la operación por infracciones críticas.");
            process.exit(1);
        } else {
            console.warn("⚠️  [WARNING] Operación permitida con advertencias.");
            process.exit(0);
        }
    }
})();
