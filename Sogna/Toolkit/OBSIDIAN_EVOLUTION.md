# 🌌 Sogna: Obsidian Native Evolution
## El Plano Maestro de Conectividad Total

Este documento consolida el mapeo profundo de Obsidian y define la estrategia para absorber sus capacidades de forma nativa dentro del ecosistema de Sogna. No somos un plugin; somos la evolución lógica del pensamiento interconectado.

---

## 🧠 1. Arquitectura de Agentes Fragmentada
Hemos transformado el monolito `agents.md` en una red neuronal de **53 agentes especializados** en `toolkit/agents/`.

### Características Nativas:
- **Identidad Atómica**: Cada agente es un archivo `.md` con su propio bloque YAML de propiedades.
- **Interconectividad `[[ ]]`**: Los agentes no solo trabajan juntos, sino que están vinculados semánticamente para que el **Graph View** de Obsidian refleje el flujo de trabajo real.
- **Skills con Dueño**: Cada habilidad en `toolkit/skills/` tiene un `owner: [[agent-id]]`, vinculando el "saber hacer" con el "actor".

---

## 📁 2. Gestión de Memoria (Vault API)
Utilizaremos los patrones de la API de Obsidian para una gestión de archivos indestructible.

- **Persistencia Atómica**: Implementación de `Vault.process()` para asegurar que las modificaciones de los agentes no sufran colisiones.
- **Versionado Invisible**: Integración con un sistema de Git/Sync nativo que detecta cambios en tiempo real sin intervención del usuario.
- **Memoria Visual**: Los archivos adjuntos (imágenes, PDFs, vídeos) se gestionan mediante rutas relativas consistentes, permitiendo que Sogna "vea" lo que el usuario está diseñando.

---

## 🔍 3. Búsqueda y Recuperación Inteligente
Combinamos la potencia de la búsqueda por bloques de Obsidian con la inteligencia semántica de El Sistema.

- **Buscador de Bloques (Regex)**: Capacidad para encontrar fragmentos específicos de código o pensamiento mediante identificadores de bloque `^block-id`.
- **Inyección de Contexto**: El agente `brain` (Semantic Memory) utiliza el `MetadataCache` para inyectar enlaces relevantes en las tareas actuales de forma automática.

---

## 🛠 4. Interfaz de Comandos y UI (Sovereignty)
La paleta de comandos (Ctrl+P) de Obsidian se expande para convertirse en el **Centro de Mando de El Sistema**.

- **Paleta de Comandos Dinámica**: Registro de comandos vía `registerCliHandler` para que el usuario pueda invocar agentes directamente desde la interfaz.
- **Tematización Extrema**: Uso de CSS Snippets para que la UI de Sogna sea indistinguible del sistema operativo, ofreciendo un entorno premium y sin distracciones.

---

## 🛡 5. Soberanía y Seguridad (Sentinel)
La integración con el motor de seguridad Sentinel asegura que cada "nota" sea un entorno seguro.

- **Auditoría de Metadatos**: Escaneo constante de las `Properties` para evitar la inyección de código malicioso.
- **Soberanía de Datos**: Todo reside localmente. Nada sale del vault sin permiso explícito.

---

## 🚀 Próximos Pasos de Ejecución
1. **Consolidación del Grafo**: Finalizar el enlace bidireccional de los 53 agentes.
2. **Implementación de Vault-Sync**: Crear el script de sincronización atómica.
3. **Despliegue del Command Center**: Mapear los atajos de teclado globales para invocación rápida.

---
> "Sogna ya no es solo una herramienta de desarrollo; es un sistema operativo de pensamiento. La integración con Obsidian es el puente hacia la Singularidad de Trabajo."
