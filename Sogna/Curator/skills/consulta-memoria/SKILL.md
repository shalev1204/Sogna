---
name: consulta-memoria
description: Utiliza esta habilidad siempre que necesites acceder a la carpeta "memory" de Sogna, buscar reglas institucionales, recuperar estándares de código, o entender el contexto a largo plazo del proyecto.
---

# Instrucciones de Consulta UMA

1. Analiza la petición del Operator y extrae las palabras clave más importantes.
2. Utiliza la herramienta `semantic_recall` proporcionada por el servidor `UMA` pasándole esas palabras clave.
3. Lee el JSON o texto resultante devuelto por la base de datos (que proviene de la carpeta `memory`).
4. Si los resultados no son suficientes, reformula tu búsqueda y vuelve a usar la herramienta.
5. Sintetiza la información recuperada e intégrala de forma invisible en tu respuesta o en tu plan de implementación.
