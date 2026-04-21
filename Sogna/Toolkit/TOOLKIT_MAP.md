# TOOLKIT_MAP: Anatomía de la Inteligencia Sogna 🧠

Este documento mapea los componentes del Toolkit que actúan como el cerebro y las manos de Sogna.

## 1. El Elenco de Agentes (Agents) 🎭
Sogna utiliza una arquitectura de agentes especializados. Los más críticos son:
- **Orchestrator**: El director de orquesta. Coordina tareas entre especialistas.
- **Security Auditor**: Vigilancia activa (conecta con Sentinel).
- **Founder**: Visión estratégica del producto.
- **Frontend/Backend Specialists**: Ejecutores técnicos de alto nivel.
- **Debugger**: Especialista en resolución de fallos y trazas.

## 2. Las Habilidades (Skills) 🛠️
Habilidades modulares que los agentes pueden invocar. Clasificadas por dominio:
- **Desarrollo**: `nextjs-react-expert`, `rust-pro`, `python-patterns`, `tailwind-patterns`.
- **Calidad**: `systematic-debugging`, `tdd-workflow`, `lint-and-validate`.
- **Seguridad**: `vulnerability-scanner`, `red-team-tactics`, `mcp-guard`.
- **Estrategia**: `omniscience`, `brainstorming`, `plan-writing`.

## 3. Los Flujos de Trabajo (Workflows) ➰
Secuencias de ejecución para tareas complejas:
- `orchestrate.md`: Lógica central de coordinación.
- `debug.md`: Ciclo de vida de resolución de bugs.
- `deploy.md`: Protocolos de puesta en producción.
- `ui-ux-pro-max.md`: Workflow de diseño y refinamiento visual.

## 4. El Núcleo Ejecutivo (Executive Core) ⚡
- **Motor en Rust**: Ubicado en `toolkit/executive-core`. Esto indica una búsqueda de máxima eficiencia y velocidad en la orquestación de bajo nivel.

---

## Próximos Pasos: Optimización Estructural 🧹

Hemos identificado archivos y carpetas redundantes. Propongo la siguiente limpieza:
1.  **Consolidación de `.turbo` y `.sognatore`**: Mover las versiones del root a las carpetas correspondientes dentro de `Sognatore/` o viceversa para evitar estados fragmentados.
2.  **Purgado de `scratch`**: Eliminar archivos temporales de sesiones pasadas.
3.  **Refinamiento de `specialists.md`**: Unificar las definiciones de agentes para evitar discrepancias.
