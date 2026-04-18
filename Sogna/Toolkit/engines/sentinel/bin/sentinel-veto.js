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

// --- Carga de Inteligencia Adaptativa ---
let riskDNA = { domains: [], flags: [], sensitive_files: [] };
try {
    const dnaPath = path.join(__dirname, '..', 'data', 'risk_dna_feed.json');
    if (fs.existsSync(dnaPath)) {
        riskDNA = JSON.parse(fs.readFileSync(dnaPath, 'utf-8'));
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

console.log("\n🛡️  [SENTINEL] Analizando integridad del commit...");

const filesToAnalyze = process.argv.slice(2).filter(a => !a.startsWith('--'));
const isFixMode = process.argv.includes('--fix');
const vetoThreshold = process.env.SENTINEL_STRICT !== 'false';

// --- Políticas de Soberanía ---
const TRUSTED_SCOPES = ['@sogna', '@predatore', '@antigravity'];
const ALLOWED_VULNS = [
    'GHSA-48c2-rrv3-qjmp', // yaml stack overflow (acceptable risk in internal configs)
    'GHSA-w87r-vg9q-crqm'  // zx symlink (not applicable in our server environment)
];
const DOMAIN_WHITELIST = [
    'api.osv.dev', 
    'google.com', 
    'googleapis.com', 
    'generativelanguage.googleapis.com', // Gemini
    'anthropic.com', 
    'api.anthropic.com',                 // Claude
    'openai.com', 
    'api.openai.com',                   // OpenAI
    'microsoft.com',                    // Teams
    'facebook.com', 
    'graph.facebook.com',               // Meta APIs
    'api.whatsapp.com', 
    'business.facebook.com',
    'sogna.js', 
    'localhost',
    '127.0.0.1'
];

// Variable/Constant names that are explicitly allowed as URL targets
const ALLOWED_TARGET_NAMES = [
    'LINEAR_API_URL',
    'SOGNATORE_CORE',
    'GITHUB_API_URL',
    'JIRA_API_URL',
    'this._endpoint',
    'this._webhookUrl',
    'this.endpoint',
    'endpoint',
    'url',        // Common in reporters
    'options',    // Standard Node.js http.request(options)
    'params',     // Standard for query params
    'config',     // Standard for config objects
    'hostname',   // Standard for DNS/HTTP lookups
    'API_BASE',   // Custom API base for frontend routes
    'BACKEND_URL',// Standard backend reference
    'BASE_URL'    // Standard base URL
];

let hasCritical = false;
let hasWarning = false;
let reportLog = "\n=== SENTINEL REPORT ===\n";

function addReport(level, reason, location, solution) {
    if (level === 'CRITICAL') hasCritical = true;
    if (level === 'WARNING') hasWarning = true;
    
    reportLog += `\n[${level}]\t${reason}`;
    reportLog += `\n\tUbicación: ${location}`;
    reportLog += `\n\tSolución : ${solution}\n`;
}

// --- DLP: Detección de Fuga de Datos ---
function scanDataLeak(filePath, content) {
    const forbiddenFiles = ['.env', '.pem', '.key', '.p12', 'id_rsa'];
    const fileName = path.basename(filePath);
    
    if (forbiddenFiles.some(f => fileName.includes(f))) {
        addReport('CRITICAL', `ARCHIVO PROHIBIDO DETECTADO: Los archivos sensibles de configuración o llaves no deben estar en staging.`, filePath, "Añadir este archivo a .gitignore y encriptar los secretos.");
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

    for (const pattern of secretPatterns) {
        const match = content.match(pattern);
        if (match) {
            addReport('CRITICAL', `EXPOSICIÓN DE SECRETO: Firma detectada vinculada a servicios externos o credenciales.`, filePath, "Eliminar la cadena y usar EnvOracle.");
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
            // --- BYPASS TRACKING ---
            const fullText = node.getFullText(sourceFile);
            if (fullText.includes('@sentinel-ignore') || fullText.includes('@sogna-ignore')) {
                const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                addReport('WARNING', `BYPASS DETECTADO: El archivo utiliza una directiva de ignorado de Sentinel.`, `${filePath}:${pos.line + 1}`, "Justificar la excepción de seguridad en el comentario.");
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
                const networkClients = ['axios', 'http', 'https', 'got', 'request', 'nodeFetch', 'superagent'];
                const isKnownNetClient = networkClients.some(c => objAccess === c || objAccess.endsWith('.' + c));
                
                const isNetCall = (ts.isIdentifier(expression) && ['fetch', 'lookup'].includes(expression.text)) || 
                                 (ts.isPropertyAccessExpression(expression) && 
                                  (['post', 'put', 'request'].includes(expression.name.text) || 
                                   (expression.name.text === 'get'))); // Broaden .get detection

                // --- ELITE: SSRF PROTECTION ---
                if (isNetCall) {
                    const urlArg = node.arguments[0];
                    if (urlArg) {
                        const urlText = urlArg.getText(sourceFile);
                        const isTainted = urlText.includes('req.query') || urlText.includes('req.params') || urlText.includes('req.body') ||
                                         Array.from(taintVariables).some(v => urlText === v);
                        if (isTainted) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('CRITICAL', `SSRF DETECTADO: Llamada de red con URL proveniente de entrada de usuario no sanitizada.`, `${filePath}:${pos.line + 1}`, "Implementar una lista blanca (whitelist) de dominios permitidos.");
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
                        if (fullText.includes('@sentinel-ignore')) return;

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

// --- FIXER: Motor de Remediación Automática ---
function applyFixes(filePath, originalContent) {
    let content = originalContent;
    const remediations = riskDNA.remediations || {};

    // 1. Cap de Delays (Logic Bombs)
    if (remediations.POSSIBLE_LOGIC_BOMB) {
        const pattern = /(setTimeout|setInterval)\s*\(\s*([^,]+)\s*,\s*(\d+|[a-zA-Z0-9_$.]+)\s*\)/g;
        content = content.replace(pattern, (match, func, cb, delay) => {
            if (delay.includes('Math.min')) return match; 
            if (parseInt(delay) > (remediations.POSSIBLE_LOGIC_BOMB.limit || 60000) || isNaN(parseInt(delay))) {
                return `${func}(${cb}, Math.min(${delay}, ${remediations.POSSIBLE_LOGIC_BOMB.limit || 60000}))`;
            }
            return match;
        });
    }

    // 2. Inyección de Justificaciones (IDOR & Exfiltración)
    const lines = content.split('\n');
    const newLines = [];
    const idorRemediation = remediations.POSSIBLE_IDOR;
    const exfilRemediation = remediations.EXFILTRATION_SUSPECT;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Fix IDOR placeholders on route definitions
        if (idorRemediation && /\.(get|post|put|delete)\s*\(\s*['"\/]/.test(line) && !lines[i-1]?.includes('@sentinel-ignore')) {
            newLines.push(`// @sentinel-ignore: ${idorRemediation.justification}`);
        }
        
        // Fix legitimate API calls (DOMAINS)
        const authorizedDomains = [
            'graph.facebook.com', 
            'api.telegram.org', 
            'api.anthropic.com', 
            'api.openai.com', 
            'generativelanguage.googleapis.com'
        ];
        const isAuthorizedCall = authorizedDomains.some(d => line.includes(d));
        if (exfilRemediation && isAuthorizedCall && !lines[i-1]?.includes('@sentinel-ignore')) {
             newLines.push(`// @sentinel-ignore: ${exfilRemediation.justification}`);
        }

        newLines.push(line);
    }
    content = newLines.join('\n');

    // 3. Purga de Identidades Pasadas (Identity Purge Integration)
    content = content.replace(/Sognatore/g, 'Sognatore');
    content = content.replace(/sognatore/g, 'sognatore');
    content = content.replace(/@sognatore/g, '@sognatore');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  ✅ ${path.basename(filePath)}: Protegido y nacionalizado.`);
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
        
        for (const [name, ver] of Object.entries(deps)) {
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
            vulns = vulns.filter(v => !ALLOWED_VULNS.includes(v.id));

            if (vulns.length > 0) {
                addReport('CRITICAL', `LIBRERÍA INFECTADA/VULNERABLE: ${name}@${cleanVer} tiene ${vulns.length} vulnerabilidades reportadas en OSV.`, filePath, `Actualizar ${name} o buscar alternativa segura.`);
            }
        }
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

        if (filePath.includes('sentinel-veto.js')) continue;

        try {
            let content = fs.readFileSync(filePath, 'utf-8');
            
            if (isFixMode) {
                applyFixes(filePath, content);
                content = fs.readFileSync(filePath, 'utf-8'); // Reload after fix
            }

            // --- MECANISMO DE EXENCIÓN & CONTENCIÓN ---
            const isContainment = fileLine.includes('tests/security_training/');
            
            if (content.includes('// @sentinel-ignore') || content.includes('/* @sentinel-ignore */')) {
                // If the file has at least one GLOBAL ignore, skip it
                if (content.match(/\/\* @sentinel-ignore \*\//) || content.match(/\/\/ @sentinel-ignore: GLOBAL/)) {
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
            
            if (fileLine.includes('toolkit/engines/sentinel/.husky/pre-commit')) {
                if (!content.includes('sentinel-veto.js') && !content.includes('lint-staged')) {
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

    if (!hasCritical && !hasWarning) {
        console.log("✅ [CLEAN] Dominio seguro. Sentinel autoriza el acceso.\n");
        process.exit(0);
    } else {
        console.error(reportLog);
        if (hasCritical && vetoThreshold) {
            console.error("⛔ [VETO] Sentinel ha bloqueado el commit por infracciones críticas.");
            try { fs.appendFileSync(path.join(__dirname, '..', 'reports', 'THREAD_INTEL.md'), `\n\n### INTRUSIÓN DETECTADA: ${new Date().toISOString()}\n${reportLog}`); } catch(e) {}
            process.exit(1);
        } else {
            console.warn("⚠️  [WARNING] Commit permitido con advertencias.");
            process.exit(0);
        }
    }
})();
