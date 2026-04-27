# Arquitectura de Datos y Conectividad

Para que El Sistema replique Obsidian, debemos entender su sistema de "rastreo" y organización de metadatos.

### 1. El Índice de Grafos (The Engine)
Obsidian escanea el "vault" en segundo plano y construye un mapa en memoria (Cache) de quién cita a quién.
- **Implementación El Sistema**: Desarrollar un "El Sistema Indexer" que analice los archivos `.md` del toolkit y la memoria para detectar dependencias y relaciones que no son obvias en el código.

### 2. Frontmatter (YAML Properties)
Uso de metadatos estandarizados al inicio de cada archivo.
- **Estándar El Sistema Propuesto**:
  ```yaml
  ---
  id: uuid-v4
  type: [agent|skill|workflow|memory]
  tags: [security, frontend, logic]
  created: 2026-04-27
  last_used: 2026-04-27
  complexity: high
  ---
  ```
- **Beneficio**: Permite realizar consultas potentes sobre el estado del sistema.

### 3. Bi-directional Links (Backlinks)
Si el archivo A enlaza al B, el archivo B muestra quién lo está llamando.
- **Uso en El Sistema**: Al abrir una Skill (ej. `read_file`), el sistema te mostrará: *"Esta skill es crítica. Está siendo usada por 12 agentes y es fundamental para 3 workflows"*.

### 4. Unificación de Paths
Obsidian permite enlazar archivos por nombre, no solo por ruta absoluta.
- **Implementación El Sistema**: Permitir que los agentes invoquen skills o memorias por su "Alias" o "ID", desacoplando la lógica de la estructura física de carpetas.
