# Plano Maestro: Evolución del Núcleo de Inteligencia Visual (Master Blueprint)

Este documento consolida 20 archivos de investigación en una arquitectura única que fusiona el conocimiento pasivo con la ejecución activa.

## 1. Visión Arquitectónica
El sistema se dividirá en tres capas fundamentales que operarán de forma sincrónica.

### A. Capa de Datos (The Nervous System)
- **Estandarización YAML**: Adopción de metadatos Obsidian-compatible en todos los archivos `.md`.
- **Relational Indexer**: Un motor en segundo plano que detecta enlaces `[[ ]]` y menciones no enlazadas para construir el grafo de conocimiento.
- **Shadow Snapshots**: Sistema de control de versiones local para evitar colisiones de archivos entre agentes y usuario.

### B. Capa Visual (The Eye)
- **Dynamic Graph Engine**: Renderizado interactivo del ecosistema usando D3.js. 
    - *Nodos de Agentes*: Representados con íconos de estado (activo, pensando, idle).
    - *Nodos de Código*: Conectados a los agentes que los mantienen.
- **Architect Canvas**: Interfaz espacial para el diseño de workflows mediante el arrastre de nodos.

### C. Capa de Control (The Hand)
- **Executive Command Palette**: Buscador omni-funcional que permite buscar archivos o ejecutar comandos (ej: `/audit security`).
- **Actionable Callouts**: Los bloques de código en las notas de memoria tendrán botones de ejecución directa.

## 2. Integración con el Ecosistema Actual
- **Sognatore Sync**: Cada vez que Sognatore ejecuta una tarea, actualizará las propiedades YAML del archivo correspondiente (ej: `last_task_success: true`).
- **Toolkit Integration**: Las nuevas "Vision Skills" se añadirán al toolkit para gestionar la base de datos de grafos.

## 3. Hoja de Ruta de Implementación (Fases)

### Fase 1: Inyección de ADN (Estandarización)
- Automatizar la adición de metadatos YAML a Agentes y Skills.
- Establecer la primera red de enlaces bi-direccionales.

### Fase 2: El Motor de Visión (Backend)
- Crear el script `VisionIndexer.ts` para generar el mapa de conexiones JSON.
- Implementar el sistema de búsqueda semántica.

### Fase 3: La Interfaz de Visualización (Frontend)
- Construir la Web App premium para el visualizador de grafos.
- Integrar la terminal en vivo dentro de la vista de agentes.

### Fase 4: Orquestación Total (Advanced Features)
- Implementar el Canvas interactivo y el sistema de resolución de conflictos por IA.

---

**Estado del Proyecto**: Investigación Finalizada. Listo para Construcción.
