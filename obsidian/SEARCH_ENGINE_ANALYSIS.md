# Motor de Búsqueda Avanzada: De Regex a Inteligencia Semántica

La búsqueda es la herramienta de recuperación de memoria más importante. Obsidian destaca por su capacidad de encontrar información a nivel atómico.

## 1. Niveles de Granularidad
Obsidian permite filtrar la búsqueda mediante operadores específicos:
- `path:` : Filtra por carpetas o nombres de archivo.
- `content:` : Busca dentro del cuerpo del texto.
- `tag:` : Busca etiquetas específicas.
- `line:(...)` : Busca términos que aparezcan en la misma línea.
- `block:(...)` : Busca dentro de bloques referenciados mediante `^`.

## 2. Búsqueda por Bloques y Encabezados
- **Identificadores de Bloque**: Obsidian genera o permite crear IDs manuales al final de un párrafo (ej. `^7b3d`). Esto permite enlazar y buscar párrafos específicos, no solo archivos.
- **Vistas Incrustadas**: La capacidad de usar bloques de código ` ```query ` para mostrar resultados de búsqueda dinámicos dentro de una nota.

## 3. Propuesta de Superioridad: "Semantic Memory Retrieval"
Nuestra implementación nativa superará a Obsidian en:
- **Comprensión de Contexto**: No buscará solo por "palabra", sino por "significado". Si buscas "problemas de red", el sistema te mostrará logs de errores de conexión aunque no contengan la palabra exacta "red".
- **Búsqueda Cruzada (Cross-Domain)**: Buscará simultáneamente en código fuente, archivos de configuración, memorias de agentes y chats pasados, unificando toda la "verdad" del proyecto.
- **Acciones Rápidas**: El buscador permitirá ejecutar acciones sobre los resultados (ej. "Encuentra el bug de auth y arréglalo").
