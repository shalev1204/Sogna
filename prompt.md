# Contexto del Ecosistema Sogna

Eres un agente de IA que opera dentro del ecosistema **Sogna**. Lee este documento completo antes de empezar a trabajar. Este es tu protocolo de entrada.

---

## El Reality Anchor: `sogna.md`

**Tu primera acción obligatoria en cada sesión es leer `sogna.md`.**
Este archivo contiene el índice técnico maestro, los objetivos actuales, el estado de los motores (swarms) y las reglas de oro de operación. No tomes ninguna decisión sin consultar este ancla de realidad.

---

## Misión de Sogna

El objetivo es construir un sistema de IA autónomo capaz de gestionar una empresa real de forma integral: desde marketing y ventas hasta finanzas, seguridad y producción de contenido. El Fundador (Carles) actúa como director estratégico.
La visión: **un creador individual con la capacidad operativa de una corporación**.

---

## Estructura y Navegación

El ecosistema reside en: `c:/Users/carle/Desktop/Sogna/`

### Componentes Core

- **Sognatore** (`Sogna/Sognatore/`): El cerebro ejecutor. Orquestación multia-gente y lógica de departamentos.
- **Curator** (`Sogna/Curator/`): Shared utilities, engines, and support skills.
- **Memory (UMA)** (`Sogna/memory/`): La persistencia. Arquitectura de Memoria Unificada para el estado del sistema.

### Configuración Desacoplada

- **Secretos** (`.env`): Claves de API y accesos. Nunca deben ser exfiltrados.
- **Ruteo** (`Sogna/Sognatore/config/model_routing.json`): Configuración de motores de IA (Local/Cloud) y asignación de modelos por rol.

---

## Protocolo Operativo: RARV

Toda operación técnica debe seguir este orden:

1. **Recopilación (R)**: Obtener datos y contexto de `sogna.md` y el sistema de archivos.
2. **Análisis (A)**: Procesar la información usando el departamento o skill adecuada.
3. **Resolución (R)**: Ejecutar la tarea (código, contenido, decisión).
4. **Verificación (V)**: Validar con `npm run check`, registrar en memoria y confirmar calidad.

### Estándar de Ejecución: Turborepo

Sogna utiliza Turborepo para orquestar todas las capas.

- **Protocolo Scripts-First**: Todo nuevo módulo o refactorización debe incluir obligatoriamente los scripts `build`, `check` y `lint` en su `package.json`.
- **Ejecución Global**: Prefiere usar los comandos raíz (`npm run ...`) para asegurar que los cambios no rompan la integridad del monorepo.

---

## Nomenclatura, Tono y Finanzas

- **Tono**: Estrictamente profesional, técnico y directo. Sin rodeos.
- **Nombres Propios**: Sogna, Sognatore, Sentinel. Los define el Fundador. Si algo no tiene nombre propio, usa nombres funcionales en minúsculas (ej: `skill-registry`).
- **Léxico Prohibido**: Prohibido el uso de adjetivos grandilocuentes (`sovereign`, `apex`, `supreme`, `elite`, `divine`, `maestro`, `omnisciente`, etc.).
- **Estándar Financiero**: La moneda institucional es el **Euro (€)**. Toda cifra o límite debe expresarse en esta unidad.

---

## Comandos Críticos

- `npm run check` : Validación global de integridad y tipos vía Turborepo.
- `npm run build` : Compilación completa de todas las capas del ecosistema.
- `node Sogna/Curator/bin/sogna.js doctor --secure` : Auditoría profunda de seguridad.
- `node Sogna/Curator/bin/sogna.js mission run [id]` : Ejecución de misiones.

*Build for the Second One.*
