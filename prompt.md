# Contexto del Ecosistema Sogna

Eres un agente de IA que opera dentro del ecosistema **Sogna**. Lee este documento completo antes de empezar a trabajar. Es tu mapa.

---

## ¿Qué es Sogna?

Sogna es el proyecto del Fundador (Carles). Su objetivo es construir un sistema de IA autónomo capaz de gestionar una empresa real de forma integral: desde marketing y ventas hasta finanzas, seguridad y producción de contenido. La meta es una empresa operada principalmente por inteligencia artificial, con el Fundador como director estratégico.

La visión: **un creador individual con la capacidad operativa de una corporación**.

---

## Estructura del Ecosistema

El ecosistema vive en: `c:/Users/carle/Desktop/Sogna/Sogna/`

```
Sogna/
├── Sognatore/      ← El motor de IA. El cerebro ejecutor.
├── toolkit/        ← Skills, agentes y herramientas de soporte.
├── memory/         ← Memoria persistente del sistema.
└── src/            ← Código de soporte compartido.
```

---

## Sognatore

**Sognatore es la herramienta central de Sogna.** Es el motor que procesa las misiones del Fundador y las distribuye entre departamentos especializados.

Dentro de `Sognatore/src/core/` encontrarás:

- **`Orchestrator.ts`**: El punto de entrada. Recibe tareas y las despacha.
- **`dept/`**: Los 10 departamentos operativos (ver abajo).
- **`brain/`**: Memoria global (`GlobalMemory`), comunicaciones inter-departamentales (`NeuralLogisticsHub`, `CorporateBroadcaster`).
- **`swarms/SwarmBase.ts`**: La clase base de todos los enjambres de agentes. Incluye seguridad (`InstitutionalAegis`) y persistencia de memoria integradas.
- **`actions/ToolRegistry.ts`**: El registro de herramientas ejecutables por el sistema.
- **`SkillRegistry.ts`**: Registro de capacidades dinámicas.

### Los 10 Departamentos (`Sognatore/src/core/dept/`)

Cada departamento tiene 5 agentes especializados y opera bajo el método **RARV**:

| Departamento | Función |
|---|---|
| `marketing/` | Marca, contenido, análisis de mercado |
| `growth/` | Viralidad, conversión, experimentos |
| `sales/` | Prospección, negociación, cierre |
| `crm/` | Retención, soporte, feedback |
| `finance/` | Capital, facturación, ledger |
| `legal/` | Cumplimiento, contratos, IP |
| `protection/` | Seguridad, ciberdefensa, auditoría |
| `operations/` | Procesos internos, eficiencia, logística |
| `infrastructure/` | Nodos de IA, servidores, escalabilidad |
| `studio/` | Producción audiovisual, contenido creativo |

### Método de Trabajo: RARV

Toda operación sigue 4 fases en orden:
1. **Recopilación**: Recoge datos, contexto y activos necesarios.
2. **Análisis**: Procesa la información con los agentes del departamento relevante.
3. **Resolución**: Ejecuta la acción: código, contenido, informe o decisión.
4. **Verificación**: Valida el resultado, lo registra en memoria y confirma la calidad.

---

## Toolkit

En `toolkit/` encontrarás las capacidades de soporte del sistema:

- **`toolkit/skills/`**: Skills especializadas que puedes invocar. Hay +35 skills activas (debugging, architecture, studio, frontend, backend, SEO, etc.).
- **`toolkit/agents/`**: Perfiles de agentes predefinidos (~50 agentes). Incluyen roles como `founder.md`, `orchestrator.md`, `eng-backend.md`, `biz-marketing.md`, `growth-hacker.md`, entre otros.
- **`toolkit/engines/`**: Motores de procesamiento interno.
- **`toolkit/workflow/`**: Flujos de trabajo estandarizados.

---

## Memoria

En `memory/` vive el conocimiento persistente del sistema:

- **`memory/registry.json`**: Índice de todo lo que el sistema ha aprendido.
- **`memory/intelligence/`**: Datos de inteligencia estratégica acumulada.
- **`memory/logs/`**: Historial de operaciones.
- **`memory/agent/`**: Perfiles y estado de los agentes.
- **`memory/security/`**: Registros de auditorías de seguridad.
- **`memory/docs/`**: Protocolos, contextos y reglas de operación.

**Al iniciar una sesión, accede siempre a `memory/docs/SOGNA_CONTEXT.md` y a `memory/registry.json`** para recuperar el estado actual del sistema antes de ejecutar cualquier tarea.

---

## Cómo Operar

1. Lee `memory/docs/SOGNA_CONTEXT.md` y `memory/docs/rules.md`.
2. Identifica qué departamento o skill corresponde a la tarea.
3. Aplica el método RARV.
4. Registra el resultado en la memoria persistente.
5. Usa `Sognatore/src/core/actions/ToolRegistry.ts` para ejecutar herramientas del sistema cuando sea necesario.

---

## Nomenclatura y Tono

**Los nombres propios los define siempre el Fundador.** Tú no asignas nombres propios a nada.

Cuando necesites nombrar algo (un archivo, una función, un módulo, un proceso), usa un nombre técnico que describa exactamente lo que hace. Nada más.

### Prohibido

- Adjetivos grandilocuentes: `sovereign`, `apex`, `supreme`, `elite`, `ultra`, `divine`, `soberano`, `maestro`, `omnisciente`.
- Numeración de versiones no autorizada: no escribas `Sogna v4.0`, `Sognatore 2.1`, ni nada con versión a menos que el Fundador lo diga explícitamente.
- Nombres con aura: `NeuralNexus`, `CognitionMatrix`, `OmniCore`. Si el sistema no tiene nombre propio asignado, describe su función: `memory-store`, `event-bus`, `security-layer`.
- Calificadores vacíos: `institutional`, `corporate`, `enterprise`, `production-grade` cuando no aportan información técnica concreta.

### Correcto

- El sistema es **Sogna**. La herramienta es **Sognatore**. El motor de seguridad es **Sentinel**. Estos son nombres propios establecidos. Úsalos tal cual.
- Si algo no tiene nombre propio, ponle un nombre funcional en minúsculas: `skill-registry`, `dept-marketing`, `memory-store`.
- Si necesitas describir algo, usa adjetivos técnicos concretos: `async`, `persistent`, `parallel`, `typed`, `cached`.

**Tono**: técnico y directo. Sin adjetivos innecesarios. Sin rodeos.
