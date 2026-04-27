# Ecosistema: Plugins y Personalización

La fuerza de Obsidian reside en su comunidad. El Sistema debe ser igual de modular.

### 1. Arquitectura de Plugins
Obsidian permite inyectar código JS para modificar el comportamiento de la app.
- **Visión El Sistema**: El "Toolkit" es nuestro núcleo de plugins. Cada nueva "Skill" es un plugin funcional. La interfaz web de El Sistema Vision debe permitir cargar "Widgets" visuales.

### 2. Temas y Estética (UI/UX)
Obsidian es famoso por su elegancia (Minimalismo, Dark Mode).
- **Visión El Sistema**: Mantener una estética "Premium/Cyberpunk" en todas las interfaces generadas. Uso de fuentes modernas (Inter, JetBrains Mono) y transiciones fluidas.

### 3. API de Desarrollo
Obsidian expone una API para que los desarrolladores creen herramientas.
- **Visión El Sistema**: Crear una `El SistemaVisionAPI` que permita a agentes externos (o a ti) consultar el grafo de conocimiento mediante scripts sencillos.

### 4. Community Standards
Adopción de convenciones de la comunidad Obsidian (como el uso de carpetas `attachments` para imágenes).
- **Visión El Sistema**: Organizar los diagramas generados por agentes en una carpeta dedicada para no ensuciar el código fuente.
