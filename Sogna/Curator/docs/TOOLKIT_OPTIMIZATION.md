# Estrategia de Optimización de Tokens (Toolkit & Chat) 📉

Para maximizar la eficiencia y reducir el "ruido cognitivo", implementamos las siguientes reglas:

## 1. Protocolo de Chat (Minimalismo Técnico)

- **Cero Relleno**: Eliminar cortesías y resúmenes innecesarios. Ir directo al dato o la acción.
- **Referencias Inteligentes**: No imprimir archivos completos si ya han sido leídos en la sesión. Usar `[Ref: Archivo.md:L10-20]`.
- **Detección de Cambios**: Solo mostrar diffs, no bloques de código completos si no es necesario.

## 2. Optimización de Prompts (Agentes y Skills)

- **Densidad de Datos**: Convertir tablas Markdown extensas en listas comprimidas.
- **Eliminación de Ejemplos**: Mover secciones de "Ejemplos" a archivos de referencia externos (`/docs/examples/`) para que el agente no los cargue en cada invocación.
- **Estructura Atómica**: Reducir instrucciones de +400 líneas a <100 líneas sin perder semántica.

## 3. Higiene Estructural

- **Unificación de Caches**: El sistema solo debe usar un directorio `.turbo` y `.sognatore` en la raíz operativa.
- **Scripting de Mantenimiento**: Automatizar la limpieza de `scratch` tras cada despliegue o sesión larga.

---

### Registro de Acciones (Fase 1)

- [x] Eliminación de carpetas duplicadas en el root (`.turbo`, `.sognatore`, `scratch`).
- [x] Consolidación de scripts de mantenimiento en `toolkit/scripts/maintenance`.
- [x] Creación de `TOOLKIT_MAP.md`.
- [/] Refactorización de `orchestrator.md` para reducir tokens (En progreso).
