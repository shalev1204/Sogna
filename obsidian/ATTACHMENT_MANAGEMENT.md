# Gestión de Adjuntos: Memoria Multimodal

Para que el sistema sea un verdadero segundo cerebro, debe manejar imágenes, vídeos, audios y PDFs con la misma fluidez que el texto.

## 1. El Protocolo de Incrustación (Embeds)
Obsidian utiliza la sintaxis `![[archivo.png]]` para mostrar contenido dentro de una nota.
- **Nuestra Estrategia**: Implementar un visualizador multimodal que permita incrustar capturas de pantalla de errores, diagramas generados por la IA y logs de terminal directamente en las bitácoras de los agentes.

## 2. Gestión de Almacenamiento (Vault Hygiene)
Obsidian permite definir una carpeta de adjuntos global o por carpeta.
- **Implementación Nativa**: El sistema gestionará una carpeta `/assets` estructurada por fecha y proyecto. La IA se encargará de renombrar y taguear los archivos adjuntos (ej. `error-log-auth-2026.png`) para que sean buscables.

## 3. Integración de PDFs y Multimedia
Obsidian permite abrir y anotar PDFs. 
- **Evolución**: Integración de un motor de OCR (Reconocimiento Óptico de Caracteres) para que la IA pueda "leer" las capturas de pantalla o PDFs técnicos que subas y convertirlos en conocimiento accionable dentro del grafo.
