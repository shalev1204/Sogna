---
last_sync: 2026-04-27T20:31:02.568Z
system_status: EVOLVING
success_rate: 100%
usage_count: 0
type: skill
name: omniscience
description: Real-time search and delegated execution capabilities. Use when the project requires information beyond the local knowledge base (Perplexity) or when long-running tasks should be delegated to specialized external agents (Manus).
id: skill-omniscience
owner: [[orchestrator]]
---

# 👁️ Habilidad: Omnisciencia Sogna

Esta habilidad otorga a los agentes la capacidad de "mirar hacia afuera" y actuar más allá de los límites locales del proyecto.

## 📡 Búsqueda en Tiempo Real (Perplexity)

Utiliza esta capacidad cuando:

- Necesites documentación actualizada de tecnologías que cambian rápido (e.g., Tauri 2.0, Framer Motion).
- Necesites investigar errores específicos que no están en la memoria local.
- Busques tendencias de diseño o componentes específicos en `21st.dev`.

### Protocolo de Uso:

1. **Formular Query:** Crea una consulta específica y técnica.
2. **Ejecutar Búsqueda:** Usa la integración de Perplexity (vía API enviada desde el .env local del proyecto).
3. **Sintetizar:** Incorpora los hallazgos en la memoria del proyecto (`Sogna/memory`).

## 🤖 Delegación de Ejecución (Manus)

Utiliza esta capacidad cuando:

- Una tarea sea demasiado compleja o larga para el agente actual.
- Se requiera ejecución en entornos aislados o especializados.
- El usuario lo solicite explícitamente ("Pásale esto a Manus").

### Protocolo de Uso:

1. **Preparar Brief:** Define claramente el sueño, los archivos de entrada y el resultado esperado.
2. **Delegar:** Envía el contexto a Manus usando la API configurada localmente.
3. **Validar:** Una vez que Manus termine, audita el código devuelto usando la habilidad `clean-code`.

## 🚨 Configuración

> [!IMPORTANT]
> Estas capacidades **requieren API Keys configuradas en el archivo `.env` del proyecto local**.
> - `PERPLEXITY_API_KEY`
> - `MANUS_API_KEY`

Si las llaves no existen, el agente debe notificar al usuario y guiarlo para configurarlas en el nuevo proyecto clonado.
