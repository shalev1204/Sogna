# Gestión de Metadatos: Notas como Celdas de Datos

Para que el sistema sea inteligente, cada archivo Markdown debe ser tratado como una fila en una base de datos. Obsidian logra esto mediante las **Properties** (YAML).

## 1. El Estándar de Propiedades
Utilizaremos el bloque de metadatos al inicio de cada archivo para definir el contexto operativo.

```yaml
---
id: string
type: [agent, skill, memory, workflow]
status: [active, idle, error, training]
priority: integer (0-10)
tags: [list, of, tags]
dependencies: [list, of, ids]
last_sync: datetime
---
```

## 2. Ventajas Operativas
- **Consultas Dinámicas**: Podemos preguntar al sistema: "Lista todas las skills con estatus 'error' y prioridad > 5".
- **Contextualización por IA**: El agente sabrá automáticamente qué archivos son relevantes basándose en las dependencias declaradas en el YAML.
- **Trazabilidad**: Cada cambio en el sistema quedará registrado en el metadato `last_sync`, permitiendo ver la evolución temporal del proyecto.

## 3. Implementación Nativa
A diferencia de Obsidian, donde el usuario debe mantener estos datos, **El Sistema** tendrá un proceso de "Background Hygiene" que mantendrá estos metadatos actualizados automáticamente tras cada ejecución.
