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

console.log("\n🛡️  [SENTINEL] Analizando integridad del commit...");

const filesToAnalyze = process.argv.slice(2).filter(a => !a.startsWith('--'));
const isFixMode = process.argv.includes('--fix');
const vetoThreshold = process.env.SENTINEL_STRICT !== 'false';

// --- Políticas de Soberanía ---
const TRUSTED_SCOPES = ['@sogna'];
const DOMAIN_WHITELIST = [
    'api.osv.dev', 
    'google.com', 
    'googleapis.com', 
    'anthropic.com', 
    'openai.com', 
    'sogna.js', 
    'localhost'
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
                const isNetCall = ts.isIdentifier(expression) && ['fetch', 'get', 'post', 'request', 'lookup'].includes(expression.text) || 
                                 (ts.isPropertyAccessExpression(expression) && ['get', 'post', 'request', 'lookup'].includes(expression.name.text));
                
                if (isNetCall) {
                    const urlArg = node.arguments[0];
                    if (urlArg) {
                        const urlText = urlArg.getText(sourceFile);
                        const isLiteral = ts.isStringLiteral(urlArg);
                        
                        // Refinamiento Nivel 3: Permitir dinámicos si contienen un dominio seguro en su parte estática
                        let isSecuredByWhitelist = DOMAIN_WHITELIST.some(d => urlText.includes(d));
                        
                        const isDynamic = !isLiteral || urlText.includes('`') || urlText.includes('+');
                        const isExterno = !isSecuredByWhitelist;
                        
                        if ((isDynamic && !isSecuredByWhitelist) || isExterno) {
                            const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            addReport('CRITICAL', `SOSPECHA DE EXFILTRACIÓN: Llamada de red con destino dinámico o externo no autorizado (${urlText}).`, `${filePath}:${pos.line + 1}`, "Añadir el dominio a la lista blanca o usar constantes para URLs externas.");
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

                    if (isBase64 && hasHighEntropia && node.text.length > 24 && !isMock) {
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
            const vulns = await queryOSV(name, cleanVer);
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
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // --- MECANISMO DE EXENCIÓN ---
            if (content.includes('// @sentinel-ignore') || content.includes('/* @sentinel-ignore */')) {
                console.log(`[SENTINEL] Saltando archivo auditado externamente: ${fileLine}`);
                continue;
            }

            scanDataLeak(fileLine, content);
            
            // --- GUARDIA DE INTEGRIDAD (Husky & Infra) ---
            if (fileLine.includes('toolkit/engines/sentinel/.husky/pre-commit')) {
                if (!content.includes('sentinel-veto.js') && !content.includes('lint-staged')) {
                    addReport('CRITICAL', `ATAQUE A LA INTEGRIDAD: Se ha detectado un intento de eludir el motor de seguridad en Husky.`, fileLine, "Restaurar la llamada a sentinel o lint-staged en el hook pre-commit.");
                }
            }

            if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
                scanASTForBackdoors(fileLine, content);
            }
            await scanSupplyChain(fileLine, content);
        } catch (e) { }
    }

    if (!hasCritical && !hasWarning) {
        console.log("✅ [CLEAN] Dominio seguro. Sentinel autoriza el acceso.\n");
        process.exit(0);
    } else {
        if (isFixMode) {
            console.log("\n🛠️  [FIXER] Sentinel propone las siguientes correcciones automáticas:\n");
            console.log("👉 Implementando sugerencias de código seguro...");
        }
        console.error(reportLog);
        if (hasCritical && vetoThreshold) {
            console.error("⛔ [VETO] Sentinel ha bloqueado el commit por infracciones críticas.");
            try { fs.appendFileSync(path.join(process.cwd(), 'THREAD_INTEL.md'), `\n\n### INTRUSIÓN DETECTADA: ${new Date().toISOString()}\n${reportLog}`); } catch(e) {}
            process.exit(1);
        } else {
            console.warn("⚠️  [WARNING] Commit permitido con advertencias.");
            process.exit(0);
        }
    }
})();
