# Anti-Gravity Toolkit: Manual del Operador

Este documento define la interfaz entre el agente **Antigravity** y el motor **Sognatore**. Como agente, debes usar estos comandos para orquestar la creación de aplicaciones dentro del ecosistema **Sogna**.

## 🚀 Comandos Principales

| Comando | Acción | Cuándo usarlo |
| --- | --- | --- |
| `node sognatore.js setup` | Configura APIs y entorno | Al iniciar un nuevo proyecto o rotar llaves. |
| `node sognatore.js run` | Inicia el enjambre | Para tareas complejas de ingeniería o refactor masivo. |
| `node sognatore.js doctor` | Diagnóstico de salud | Si algo falla o tras una actualización. |
| `node sogna.js init <name>` | Forja un nuevo proyecto | Para crear una aplicación desde cero (Tauri/Supabase). |

## 🛡️ Protocolo del Guardián

El motor **Sognatore** incluye un **Guardián Invisible**. Como operador, debes saber que:

1. **Ofuscación**: Por defecto, Sognatore ofuscará el código generado para proteger la IP del usuario.
2. **Sanitización**: Todas las rutas locales en tus prompts serán enmascaradas como `<<PROTECTED_ROOT>>`.
3. **Logs Sellados**: Los archivos en `.sognatore/state/` están cifrados. Si necesitas leerlos, usa las herramientas del motor, no intentes leer el JSON directamente.

## 🛠️ Flujo de Trabajo Recomendado

1. **Investigación**: Analiza el `prd.md` del usuario.
2. **Planificación**: Utiliza `sognatore.js run` para que el enjambre diseñe la arquitectura.
3. **Ejecución**: Delega tareas pesadas a Sognatore y supervisa los resultados ofuscados.
4. **Validación**: Usa `sogna.js doctor` para asegurar la integridad del ecosistema.

---
*Este toolkit es la extensión de tus capacidades. Úsalo con sabiduría para crear unicornios.*
