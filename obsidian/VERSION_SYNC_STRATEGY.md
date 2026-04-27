# Gestión de Versiones: Inmortalidad y Sincronización

La integridad de la información es el pilar sobre el que se construye la confianza en un sistema. Obsidian utiliza estrategias de recuperación local y sincronización que debemos integrar.

## 1. File Recovery (Instantáneas Locales)
Obsidian mantiene un historial de versiones cortas en una carpeta interna (`.obsidian/internal`). Esto permite recuperar texto perdido por cierres inesperados o errores de escritura.
- **Nuestra Estrategia**: Implementar un sistema de "Shadow Copy" en el toolkit que realice backups automáticos de cada archivo `.md` antes de que un agente realice una edición masiva.

## 2. Sincronización y Conflictos (Sync)
Obsidian Sync utiliza un protocolo de "Last Write Wins" con soporte para versiones históricas.
- **Evolución Nativa**: Utilizaremos **Git** como motor de fondo, pero con una capa de "IA Arbitraje". Si un agente y el usuario editan el mismo bloque de código, la IA analizará ambas intenciones y propondrá un `merge` inteligente, evitando la pérdida de información.

## 3. Resiliencia de la Memoria
El sistema debe asegurar que las "Memorias" de los agentes no se corrompan durante procesos de sincronización entre diferentes dispositivos o instancias del toolkit.
