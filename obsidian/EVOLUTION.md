# El Sistema Vision: Mapa de Ruta de la Evolución

Este es el plan para absorber la inteligencia de Obsidian y convertir a El Sistema en una entidad visual y conectada.

### Fase 1: Estandarización de Metadatos (Data Layer)
- [ ] Implementar YAML Frontmatter en todos los archivos de `toolkit/agents`.
- [ ] Implementar YAML Frontmatter en `toolkit/skills`.
- [ ] Crear el estándar de enlaces `[[Agente -> Skill]]`.

### Fase 2: El Motor de Indexación (Engine Layer)
- [ ] Desarrollar `Parser.ts`: Escanea el repo y genera el JSON de conexiones.
- [ ] Implementar `Relator.ts`: Encuentra relaciones semánticas entre archivos de código.

### Fase 3: La Interfaz de Visualización (View Layer)
- [ ] Dashboard Web Premium en el Toolkit.
- [ ] Renderizado de Grafo interactivo (Nodos de Agentes, Skills y Código).
- [ ] Buscador semántico integrado.

### Fase 4: Orquestación Visual (Control Layer)
- [ ] Implementar "Canvas" para dibujar workflows que generen código automáticamente.
- [ ] Integración de logs en tiempo real sobre el gráfico.

---

**Nota Final**: Obsidian es el mapa; El Sistema es el territorio. Al unirlos, tendremos un sistema que no solo sabe qué hacer, sino que sabe *por qué* lo está haciendo y cómo se conecta con todo lo demás.
