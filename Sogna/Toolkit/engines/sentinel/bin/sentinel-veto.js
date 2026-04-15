#!/usr/bin/env node

/**
 * Sentinel Veto Hook (Supreme Training Edition)
 * Este script verifica la seguridad del repositorio de los archivos mutados antes del commit.
 * Implementa DLP, AST Shielding y Supply Chain Integrity (OSV).
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const https = require('https');

console.log("\n🛡️  [SENTINEL SUPREME] Analizando integridad del commit...");

const filesToAnalyze = process.argv.slice(2);
const vetoThreshold = process.env.SENTINEL_STRICT !== 'false';

let hasCritical = false;
let hasWarning = false;
let reportLog = "\n=== SENTINEL SUPREME REPORT ===\n";

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

// --- AST: Guardia Sintáctico ---
function scanASTForBackdoors(filePath, content) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;

    try {
        const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
        function visit(node) {
            if (ts.isCallExpression(node)) {
                const expression = node.expression;
                if (ts.isIdentifier(expression)) {
                    if (expression.text === 'eval') {
                        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        addReport('CRITICAL', `AST INTERVENTION: Ejecución Arbitraria (eval).`, `${filePath}:${pos.line + 1}`, "Riesgo de RCE. Prohibido por Sogna Policy.");
                    }
                }
                if (ts.isPropertyAccessExpression(expression)) {
                    const propName = expression.name.text;
                    if (['exec', 'execSync', 'spawn', 'spawnSync'].includes(propName)) {
                        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        addReport('WARNING', `AST VIGILANCE: Uso de Shell Externo (${propName}).`, `${filePath}:${pos.line + 1}`, "Asegurar sanitización total de argumentos.");
                    }
                }
            }
            // Detección básica de ReDoS (Regex muy largos/complejos)
            if (ts.isRegularExpressionLiteral(node)) {
                if (node.text.length > 100 && (node.text.includes('*') || node.text.includes('+'))) {
                    const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    addReport('WARNING', `POSIBLE REDOS: Expresión regular excesivamente compleja encontrada.`, `${filePath}:${pos.line + 1}`, "Simplificar la regex o usar un validador de tiempo.");
                }
            }
            ts.forEachChild(node, visit);
        }
        visit(sourceFile);
    } catch (e) {}
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
    for (const file of filesToAnalyze) {
        try {
            if (fs.existsSync(file) && fs.statSync(file).isFile()) {
                const content = fs.readFileSync(file, 'utf-8');
                scanDataLeak(file, content);
                scanASTForBackdoors(file, content);
                await scanSupplyChain(file);
            }
        } catch (e) {}
    }

    if (!hasCritical && !hasWarning) {
        console.log("✅ [CLEAN] Dominio seguro. Sentinel autoriza el acceso.\n");
        process.exit(0);
    } else {
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
