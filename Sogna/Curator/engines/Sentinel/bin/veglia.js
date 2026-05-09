#!/usr/bin/env node

/**
 * Veglia: Proactive Sentinel Orchestrator
 * Sogna Active Vigilance System (L2 Proactivity)
 * 
 * This engine centralizes and automates git hooks, moving from reactive blocking
 * to proactive repair and autonomous auditing.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(_dirname, '../../../../..');
const SENTINEL_DIR = path.join(_dirname, '..');
const SENTINEL_VETO = path.join(_dirname, 'sentinel-veto.js');
const SENTINEL_FIX = path.join(_dirname, 'sentinel-fix.js');

const COMMAND = process.argv[2];
const ARGS = process.argv.slice(3);

/**
 * Log with institutional branding
 */
function log(msg, type = 'info') {
    const icons = { info: '🛡️', warn: '⚠️', error: '🚨', success: '✅', repair: '🔧' };
    console.log(`${icons[type] || '•'} [VEGLIA] ${msg}`);
}

/**
 * Call Ollama for intelligent commit message repair
 */
async function repairCommitMessage(msgFile) {
    const originalMsg = fs.readFileSync(msgFile, 'utf8').trim();
    log('Analizando mensaje de commit con inteligencia semántica...', 'info');

    const prompt = `Actúa como el Sentinel de Sogna. El siguiente mensaje de commit no cumple con las normas institucionales (Conventional Commits).
    
Normas:
- Formato: <tipo>(<ámbito>): <descripción>
- Tipos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Minúsculas en el asunto.
- Sin punto final.

Mensaje original: "${originalMsg}"

Devuelve ÚNICAMENTE el mensaje corregido y profesional. Sin explicaciones adicionales.`;

    try {
        // Use curl to talk to Ollama (assuming local server on default port)
        const response = spawnSync('curl', [
            '-s',
            '-X', 'POST',
            'http://localhost:11434/api/generate',
            '-d', JSON.stringify({
                model: 'llama3', // or the user's preferred model
                prompt: prompt,
                stream: false
            })
        ], { encoding: 'utf8' });

        if (response.status === 0) {
            const result = JSON.parse(response.stdout);
            const correctedMsg = result.response.trim();
            if (correctedMsg && correctedMsg !== originalMsg) {
                log(`Reparación sugerida: "${correctedMsg}"`, 'repair');
                fs.writeFileSync(msgFile, correctedMsg);
                log('Mensaje de commit actualizado automáticamente.', 'success');
                return true;
            }
        }
    } catch (e) {
        log(`Error en la conexión con Ollama: ${e.message}`, 'error');
    }
    return false;
}

/**
 * Main Orchestrator
 */
async function main() {
    switch (COMMAND) {
        case 'pre-commit':
            log('Iniciando vigilancia activa pre-commit...', 'info');
            
            // 1. Run Sentinel Veto
            log('Ejecutando auditoría de seguridad (Sentinel Veto)...', 'info');
            const veto = spawnSync('node', [SENTINEL_VETO, '--staged'], { stdio: 'inherit' });
            
            if (veto.status !== 0) {
                log('Auditoría de seguridad fallida. Revisión manual requerida para fugas de datos.', 'error');
                process.exit(1);
            }
            
            // 2. Lint Staged with Auto-repair
            log('Ejecutando lint-staged (Calidad Proactiva)...', 'info');
            const lint = spawnSync('npx', ['lint-staged'], { stdio: 'inherit', cwd: ROOT_DIR });
            
            if (lint.status !== 0) {
                log('Se detectaron errores de calidad. Intentando auto-reparación...', 'repair');
                // Attempt global fix on staged files
                const autoFix = spawnSync('npx', ['eslint', '--fix', '--ext', '.js,.ts,.tsx', 'Sogna/'], { stdio: 'inherit', cwd: ROOT_DIR });
                
                if (autoFix.status === 0) {
                    log('Reparaciones aplicadas. Re-validando lint-staged...', 'info');
                    const secondLint = spawnSync('npx', ['lint-staged'], { stdio: 'inherit', cwd: ROOT_DIR });
                    if (secondLint.status === 0) {
                        log('Calidad restaurada proactivamente.', 'success');
                    } else {
                        log('No se pudieron corregir todos los errores automáticamente.', 'error');
                        process.exit(1);
                    }
                } else {
                    log('Fallo en el motor de auto-reparación sintáctica.', 'error');
                    process.exit(1);
                }
            }
            
            // 3. Memory Hygiene (Autonomous Care)
            log('Iniciando higiene de memoria autónoma...', 'info');
            const memoryPrune = spawnSync('python', [path.join(ROOT_DIR, 'Sogna/memory/identity/prune.py')], { stdio: 'inherit' });
            if (memoryPrune.status === 0) {
                log('Higiene de memoria completada.', 'success');
            } else {
                log('El motor de higiene de memoria reportó advertencias.', 'warn');
            }
            
            // 4. Lab Sanitization (Autonomous Lab Maintenance)
            log('Iniciando sanitización proactiva del laboratorio...', 'info');
            const labSanitizer = spawnSync('python', [path.join(ROOT_DIR, 'Sogna/Curator/scripts/SognaSanitizer.py'), path.join(ROOT_DIR, 'Sogna/Curator/lab')], { stdio: 'inherit' });
            const labPurifier = spawnSync('python', [path.join(ROOT_DIR, 'Sogna/Curator/scripts/md_purifier.py'), '--root', path.join(ROOT_DIR, 'Sogna/Curator/lab')], { stdio: 'inherit' });
            
            if (labSanitizer.status === 0 && labPurifier.status === 0) {
                log('Sanitización de laboratorio completada.', 'success');
            } else {
                log('El sanitizador de laboratorio reportó advertencias.', 'warn');
            }
            
            log('Vigilancia pre-commit completada con éxito.', 'success');
            break;

        case 'commit-msg':
            const msgFile = ARGS[0];
            if (!msgFile) {
                log('Falta archivo de mensaje de commit.', 'error');
                process.exit(1);
            }

            log('Validando semántica del commit...', 'info');
            // Simplified check, real one should use regex
            const content = fs.readFileSync(msgFile, 'utf8').trim();
            const validPattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,72}$/;
            
            if (!validPattern.test(content)) {
                log('Mensaje de commit no válido.', 'warn');
                const fixed = await repairCommitMessage(msgFile);
                if (!fixed) {
                    log('No se pudo reparar el mensaje automáticamente. Por favor, usa Conventional Commits.', 'error');
                    process.exit(1);
                }
            } else {
                log('Semántica validada.', 'success');
            }
            break;

        default:
            log(`Comando desconocido: ${COMMAND}`, 'error');
            process.exit(1);
    }
}

main();
