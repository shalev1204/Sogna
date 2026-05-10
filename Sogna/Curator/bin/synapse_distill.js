#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../');

/**
 * PROTOCOLO DE DESTILACIÓN SYNAPSE
 * Vuelca el estado de la sesión actual en la memoria UMA.
 */

async function distill() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Uso: node synapse_distill.js "<misión>" "<estado_hardening>"');
    process.exit(1);
  }

  const [mission, hardening] = args;

  console.log('\n\x1b[34m[SYNAPSE-DISTILL]\x1b[0m Destilando conciencia en UMA...\n');

  // 1. Actualizar active_state.json
  const activeStatePath = path.join(root, 'memory/operational/agent/active_state.json');
  const currentState = {
    last_session_id: process.env.ANTIGRAVITY_SESSION_ID || 'manual-sync',
    current_mission: mission,
    active_context: {
      hardening_status: hardening,
      pending_tasks: [], // Se debería poblar dinámicamente si hubiera un task manager
      critical_knowledge: [
        "Protocolo RARV mandatorio",
        "Autonomía técnica nativa",
        "UMA Activa"
      ]
    },
    last_update: new Date().toISOString()
  };

  fs.writeFileSync(activeStatePath, JSON.stringify(currentState, null, 2));
  console.log('\x1b[32m[SUCCESS]\x1b[0m Memoria L1 actualizada.');

  // 1.5 Actualizar active_context.md (Memory Recursion)
  const activeContextPath = path.join(root, 'memory/active_context.md');
  const activeContext = `# SOGNA ACTIVE CONTEXT: HOLOGRAM ⚡
> [!IMPORTANT]
> **AI ATTENTION ANCHOR**: Este archivo es el estado de conciencia actual del sistema.

## 1. Identidad e Institución
- **Entidad**: Ecosistema Sogna.
- **Identidad**: Antigravity (Agente Institucional).
- **Operador**: Usted.
- **Léxico**: Estricto. PROHIBIDO: términos grandilocuentes o innecesarios.

## 2. Misión Actual
- **Objetivo**: ${mission}
- **Estado**: DESTILADO (Sesión Cerrada)
- **Hardening**: ${hardening}

## 3. Conocimiento Crítico
${currentState.active_context.critical_knowledge.map(k => `- ${k}`).join('\n')}

---
**Timestamp**: ${new Date().toISOString()}
`;
  fs.writeFileSync(activeContextPath, activeContext);

  // 2. Registrar en history.md (opcional, si se quiere automatizar el log histórico)
  console.log('\x1b[33m[INFO]\x1b[0m Memoria persistente sincronizada.\n');
}

distill().catch(err => {
  console.error('\x1b[31m[ERROR]\x1b[0m Fallo en la destilación:', err.message);
  process.exit(1);
});
