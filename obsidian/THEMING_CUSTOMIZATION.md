# Temas y CSS: El Sistema de "Pieles" Dinámicas

La estética no es solo decorativa; es funcional. Obsidian permite una personalización extrema que debemos replicar y mejorar.

## 1. Arquitectura de Estilos (CSS Custom Properties)
Obsidian basa su diseño en un sistema masivo de variables CSS que definen todo, desde el color de fondo hasta el grosor de los bordes.
- **Nuestra Estrategia**: Definir un "Theme Engine" basado en tokens de diseño que permita cambiar la "vibra" del sistema (ej. modo hacker, modo ejecutivo, modo lectura) instantáneamente.

## 2. Snippets: Micro-Personalización
Los snippets permiten al usuario inyectar fragmentos de CSS sin cambiar el tema base.
- **Implementación Nativa**: Permitiremos "CSS Modules" que se activen según la tarea. Por ejemplo, si estás auditando seguridad, la interfaz puede cambiar a un tono ámbar/rojo de alerta automáticamente.

## 3. Componentes Visuales Premium
Mapeamos los elementos visuales que hacen que Obsidian se sienta "premium":
- **Lucide Icons**: Uso de iconografía minimalista y consistente.
- **Translucencia y Blur**: Efectos de cristal (glassmorphism) para profundidad visual.
- **Typography Engine**: Soporte para fuentes variables y optimización de legibilidad para código.
- **Micro-interacciones**: Transiciones suaves al abrir paneles o expandir nodos del grafo.

## 4. Estética de "El Sistema"
Superaremos a Obsidian ofreciendo una interfaz que se sienta **viva**. Los estilos no serán estáticos; reaccionarán a la carga de trabajo de los agentes o al estado de salud del código (Sentinel Status).
