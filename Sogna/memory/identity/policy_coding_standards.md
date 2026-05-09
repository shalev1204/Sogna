# SOGNA - CODING STANDARDS (PROCEDURAL LAYER)

Estándares técnicos para el desarrollo y mantenimiento del monorepo Sogna.

## 1. Lenguaje y Tipado

- **TypeScript Obligatorio**: Todo el código core debe usar TypeScript. El uso de `any` está prohibido.
- **ESM Exclusivo**: Uso estricto de ECMAScript Modules (`import`/`export`).
- **Strict Typing**: Todas las interfaces y tipos deben estar definidos en archivos `.ts` dedicados o dentro del módulo si son locales.

## 2. Arquitectura de Archivos

- **Pathing Robusto**: Siempre usa `path.join()` y rutas relativas en minúsculas. Evita rutas absolutas de Windows.
- **Atomicidad**: Una característica o bugfix por tarea. Evita cambios masivos en múltiples capas sin un plan aprobado.
- **Case Sensitivity**: El sistema opera en Windows pero debe ser compatible con Linux. Usa minúsculas para todos los nombres de archivos y directorios.

## 3. Manejo de Errores

- **Resiliencia**: Cada error relanzado DEBE incluir la propiedad `{ cause: error }`.
- **Logs Operativos**: Los fallos críticos deben registrarse en `memory/operational/logs/sogna_operations.log`.

## 4. Verificación Continua

- **Sentinel Veglia**: El sistema de githooks nativo (`.veglia`) es la primera línea de defensa. No intentes bypassear los hooks.
- **Scripts de Validación**: Ejecuta `python ../Curator/scripts/verify_all.py` antes de cada entrega final.

---

*Referencia: `registry.json` (State: Prime)*
