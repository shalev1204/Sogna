# Mapeo de Archivos Internos: El ADN de Configuración

Para lograr una integración fluida, debemos ser capaces de leer y replicar la configuración del usuario en Obsidian.

## 1. app.json (Lógica del Sistema)
Este archivo contiene las preferencias globales.
- `attachmentFolderPath`: Ubicación de adjuntos.
- `newFileLocation`: Dónde se crean las notas nuevas.
- `useMarkdownLinks`: Preferencia de formato de enlace.
- **Estrategia**: El Sistema leerá estos parámetros para que cuando crees un archivo desde el toolkit, aparezca exactamente donde Obsidian lo espera.

## 2. appearance.json (Estética y Estilo)
Define el aspecto visual.
- `accentColor`: El color principal de la interfaz.
- `baseFontSize`: Tamaño de fuente base.
- `theme`: Nombre del tema activo.
- **Estrategia**: Nuestra interfaz web podrá "espejar" el color de acento y el tema de Obsidian para una experiencia visual unificada.

## 3. core-plugins.json
Define qué funciones nativas están activas (Graph, Search, Canvas).
- **Estrategia**: Activaremos las "Vistas de Vision" equivalentes basándose en los plugins que el usuario use habitualmente.

## 4. workspace.json
Contiene el estado de las ventanas y pestañas abiertas.
- **Estrategia**: Podremos restaurar tu sesión de trabajo de Obsidian dentro del toolkit si decides cambiar de interfaz.
