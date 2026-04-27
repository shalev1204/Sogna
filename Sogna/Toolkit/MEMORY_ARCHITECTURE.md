# 🧠 Arquitectura de Memoria Neuronal (Sogna vs Obsidian)

## 1. El Salto Evolutivo: De la Búsqueda a la Comprensión

| Característica | Obsidian (Estándar) | Sognatore (Neural) |
|---|-|---|
| **Motor Base** | Texto Plano / Regex | Búsqueda Híbrida (Vectorial + BM25) |
| **Contexto** | Ninguno (Coincidencia exacta) | Semántico (Entiende conceptos relacionados) |
| **OCR** | Plugin de Terceros | Nativo en el Núcleo (Visión del Sistema) |
| **Estructura** | Archivos Sueltos | **Graph RAG** (Basado en Swarms y Collegas) |
| **Privacidad** | Local (pero depende de plugins AI) | **Soberanía Total** (Modelos locales vía Ollama/Llama.cpp) |

## 2. Capas de la Memoria de Sognatore

### Capa 0: Memoria de Corto Plazo (Contexto de Sesión)
*   **Implementación**: `/scratch/` y logs de conversación activos.
*   **Función**: Proporcionar coherencia inmediata a la tarea actual.

### Capa 1: Memoria de Largo Plazo (Conocimiento Indexado)
*   **Implementación**: Base de datos vectorial integrada en Sognatore.
*   **Función**: Recuperar "Habilidades" y "Logs Históricos" de hace meses mediante lenguaje natural.
*   **Ejemplo**: "Busca cuando tuvimos problemas con el Sentinel hace un mes" → Encuentra el log de error aunque no busques "Sentinel".

### Capa 2: Memoria Estructural (El Grafo de Agentes)
*   **Implementación**: Los enlaces `[[ ]]` entre Agentes y Swarms.
*   **Función**: Permitir que la búsqueda "navegue" por las especialidades. Si el `eng-api` busca algo, Sognatore prioriza resultados de sus `colleagues` en el enjambre de ingeniería.

## 3. Integración con el Toolkit

Los agentes del Toolkit no solo leen archivos; **consultan a la Red Neuronal**:
- `/find [concepto]`: No busca el archivo, busca la *idea* en todo el ecosistema.
- `brain agent`: Actúa como el indexador constante, asegurando que cada nueva nota en `obsidian/` sea vectorizada instantáneamente.

---
> [!IMPORTANT]
> Sognatore no guarda notas; guarda **relaciones de inteligencia**.
