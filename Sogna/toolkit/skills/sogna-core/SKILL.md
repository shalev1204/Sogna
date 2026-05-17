---
name: sogna-core
description: "Instrucciones operativas deterministas para interactuar con el ecosistema Sogna y el toolkit Sognatore."
risk: normal
source: user
date_added: "2026-04-29"
---

# Operación del Núcleo Sogna

## 🎯 Propósito
Habilitar al agente para utilizar las capacidades avanzadas de Sogna: RAG, multi-agente, y seguridad Sentinel.

## 🛠️ Protocolo de Activación
Cuando el usuario solicite activar Sogna o uses la frase de activación:
1. Lee el KI `Sogna_Ecosystem` para ubicar los recursos.
2. Posiciónate en `c:/Users/carle/Desktop/Sogna/Sogna/Sognatore`.
3. Ejecuta `node toolkit/bin/sogna.js doctor` para confirmar que el sistema está operativo.

## 🎨 Estilo de Respuesta (Dashboard + Alertas)
- **Reportes de Estado:** Utiliza tablas estructuradas con semáforos (🟢/🟡/🔴/🔵).
- **Eventos Críticos:** Utiliza bloques de alerta nativos (`> [!IMPORTANT]`, `> [!NOTE]`).

## 🔒 Reglas de Seguridad (Sentinel)
- Respeta las directrices de Sentinel en `src/Sentinel-Sognatore/policies.yaml`.
- No realices acciones destructivas sin aprobación explícita.
- Utiliza el `MemoryHub` para persistencia neuronal.
