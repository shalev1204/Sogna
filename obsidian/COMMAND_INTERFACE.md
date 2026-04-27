# Interfaz de Comandos: Velocidad de Ejecución

La velocidad operativa es una ventaja competitiva. Vamos a mapear el sistema de control por teclado de Obsidian.

## 1. Paleta de Comandos (Ctrl+P / Ctrl+Shift+P)
Un centro neurálgico que permite ejecutar cualquier función del sistema mediante búsqueda aproximada (Fuzzy Search).
- **Implementación**: El Toolkit tendrá un "Command Center" que unifique la búsqueda de archivos y la ejecución de órdenes a agentes. Podrás escribir `> analyze security` y el sistema sabrá qué agente y qué skill invocar.

## 2. Atajos de Teclado (Hotkeys)
Obsidian permite re-mapear cualquier acción.
- **Nuestra Estrategia**: Atajos pre-configurados para las tareas más comunes (ej. `Alt+G` para abrir el Grafo, `Alt+A` para llamar al agente de turno).

## 3. Automatización vía Comandos (Templater/QuickAdder)
Capacidad de encadenar acciones mediante comandos.
- **Evolución**: "Smart Macros". Podrás definir comandos personalizados que realicen tareas complejas (ej. "Prepara el entorno para un nuevo módulo de frontend") y asignarlos a un atajo de teclado o una entrada en la paleta de comandos.
