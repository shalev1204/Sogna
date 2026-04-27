# Mapeo de la API: Conectividad y Apertura Total

Para que el sistema sea el más potente, debe tener una API interna robusta que permita la extensibilidad total.

## 1. MetadataCache (El Índice de Inteligencia)
Obsidian indexa enlaces, tags y metadatos YAML de forma asíncrona.
- **Nuestra Estrategia**: Crear un índice persistente en el sistema que permita consultas semánticas instantáneas. La IA podrá saber en milisegundos qué archivos están relacionados con una vulnerabilidad de seguridad.

## 2. Vault Events (Reactividad)
El sistema reacciona a eventos de creación, modificación y borrado de archivos.
- **Nuestra Estrategia**: Un sistema de "Hooks" reactivos. Cuando edites un archivo de configuración, el sistema podrá disparar automáticamente una validación de Sentinel o una tarea de limpieza sin que tú lo pidas.

## 3. Workspace API (Control Visual)
Permite gestionar la disposición de las pestañas y paneles.
- **Nuestra Estrategia**: Una interfaz web flexible basada en componentes (tipo Next.js) que permita "guardar" disposiciones de pantalla para diferentes tipos de trabajo (Mapeo, Codificación, Auditoría).
