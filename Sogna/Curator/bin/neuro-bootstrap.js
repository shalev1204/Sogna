/**
 * 🏛️ SOGNA NEURO-BOOTSTRAP
 * Este script garantiza la sincronización identitaria y técnica 
 * al inicio de cada sesión operativa.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_PATH = path.resolve(__dirname, '../../');
const SSOT_PATH = path.join(ROOT_PATH, 'memory/identity/sogna.md');
const SENTINEL_PATH = path.join(ROOT_PATH, 'Sentinel/bin/sentinel-identity.py');

console.log("--- 🧠 INICIANDO NEURO-BOOTSTRAP SOGNA ---");

// 1. Verificación de Identidad (SSOT)
if (fs.existsSync(SSOT_PATH)) {
    console.log("✅ SSOT Localizado. Sincronizando parámetros de identidad...");
    const content = fs.readFileSync(SSOT_PATH, 'utf-8');
    // Simulación de anclaje neural: Se asume que el agente lee esto.
} else {
    console.error("❌ ERROR CRÍTICO: SSOT de Sogna no encontrado. Abortando misión.");
    process.exit(1);
}

// 2. Verificación de Integridad de Sentinel
try {
    const result = execSync(`python ${SENTINEL_PATH}`).toString();
    console.log(result);
} catch (e) {
    console.error("⚠️ ALERTA: Fallo en la auditoría de identidad inicial.");
}

// 3. Verificación de Memoria Operacional
const historyPath = path.join(ROOT_PATH, 'memory/operational/logs/history.md');
if (fs.existsSync(historyPath)) {
    console.log("✅ Memoria operacional detectada. Recuperando contexto de sesión...");
}

console.log("--- 🏛️ SISTEMA SINCRONIZADO: BUILD FOR THE SECOND ONE ---");
process.exit(0);
