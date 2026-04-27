# Arquitectura del Canvas: La Pizarra Infinita

El Canvas es la herramienta de pensamiento espacial más potente de Obsidian. Vamos a replicar y mejorar su arquitectura JSON.

## 1. El Esquema de Datos (.canvas)
Un archivo de Canvas es un objeto JSON que posiciona nodos en un espacio 2D.

```json
{
  "nodes": [
    {
      "id": "node_id",
      "type": "file|text|link",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "file": "path/to/file.md"
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "fromNode": "id_1",
      "toNode": "id_2",
      "label": "relationship"
    }
  ]
}
```

## 2. Evolución: "The Living Canvas"
Nuestra implementación nativa tendrá las siguientes mejoras:
- **Nodos de Ejecución**: Verás la terminal del agente corriendo dentro del nodo del Canvas.
- **Edges Dinámicos**: Las flechas mostrarán el flujo de datos (animaciones de movimiento de datos) entre agentes.
- **Auto-Diagramación**: El sistema dibujará el esquema de una arquitectura de software compleja automáticamente tras escanear el código.

## 3. Integración con el Toolkit
El Canvas no será solo visual; será un **Panel de Control**. Mover un nodo de "Skill" hacia un "Agente" en el Canvas podría configurar automáticamente la dependencia en sus metadatos YAML.
