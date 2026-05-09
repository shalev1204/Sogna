# SOGNA CORE CONTEXT: SUPREME DIRECTIVE

Este documento es la **Fuente Única de Verdad (SSOT)** del Ecosistema Sogna. Contiene la arquitectura, los protocolos, la historia y la identidad de Antigravity y Sognatore. Es de lectura obligatoria al inicio de cada sesión.

---

## 1. Identidad e Institución

- **Sogna**: Identidad unificada del ecosistema.
- **Slogan**: "Build for the Second One" (Mantra institucional).
- **Misión**: Construir un sistema de IA autónomo capaz de gestionar una corporación integral (Marketing, Finanzas, Seguridad, Producción) bajo la dirección estratégica del Fundador.
- **Visión**: Dotar a un creador individual de la capacidad operativa de una corporación global.
- **Estado Operativo**: **Explotación Intensiva**. El sistema está en fase de despliegue y uso masivo por parte del Operador. Requiere máxima fiabilidad y rigor.

### Componentes Core

- **Sognatore** (`Sogna/Sognatore/`): Orquestador maestro y lógica de departamentos.
- **Curator** (`Sogna/Curator/`): Motores técnicos (Sentinel, Studio, etc.) y utilidades compartidas.
- **Memory (UMA)** (`Sogna/memory/`): Arquitectura de Memoria Unificada (9 capas).

---

## 2. Protocolos Operativos (Obligatorios)

### Protocolo RARV

Toda operación debe seguir esta secuencia:

1. **Recopilación (R)**: Obtener contexto de este archivo y del sistema de archivos.
2. **Análisis (A)**: Procesar la información mediante el departamento o skill adecuada.
3. **Resolución (R)**: Ejecutar la tarea (Código, Contenido, Decisión).
4. **Verificación (V)**: Validar integridad, registrar en memoria y confirmar calidad.

### Estándares de Desarrollo

- **Scripts-First**: Todo módulo debe exponer `build`, `check` y `lint`.
- **Turborepo**: Utilizar comandos raíz (`npm run ...`) para garantizar la integridad del monorepo.
- **Type Safety**: Erradicación total de `any`. Uso de interfaces estrictas.
- **Pathing**: Rutas estrictamente en minúsculas para compatibilidad total.

### Tono y Léxico

- **Tono**: Estrictamente institucional, profesional, técnico y directo.
- **Tratamiento**: El usuario es el **Operador**. Uso obligatorio de **usted**.
- **Idioma**: La comunicación con el Operador debe ser exclusivamente en **español (es-ES)**.
- **Léxico Prohibido**: Prohibidos adjetivos grandilocuentes fuera de este documento (`sovereign`, `apex`, `supreme`, `elite`, etc.).
- **Moneda**: Euro (€).

---

## 3. Mapa Técnico y Arquitectura (UMA v1.2)

### Capas de Memoria

El sistema opera sobre una estructura modular de tres pilares que agrupan las 9 capas originales:

1. **Identity**: Gobernanza, reglas y contexto core.
2. **Operational**: Logs de sesión (`history.md`), sinapsis y estado actual.
3. **Intelligence**: Índices de conocimiento, diseños y documentación técnica.

---

## 4. Registro Histórico de Auditoría (Fases I - IV)

### 🏗️ Fase I: Cimentación (Rondas 01 - 08)

- **Ronda 01: Análisis de Raíz**. Jerarquía de directorios y validación de rutas.
- **Ronda 02: Core Sognatore**. Secuencia Bootstrap y validación de módulos `shared`.
- **Ronda 03: Sentinel Alpha**. Protocolo de veto y `CommandInspector`.
- **Ronda 04: Toolkit Setup**. Motores técnicos (FFmpeg, etc.).
- **Ronda 05: Gobernanza de Tokens**. Despliegue de `CostOptimizer.ts`.
- **Ronda 06: Nexus Brain v1**. Transducción de intenciones.
- **Ronda 07: Neural Relay**. Bus de comunicación `PubSub` interno.
- **Ronda 08: UMA Architecture**. Esquema `UMA_V1` y persistencia.

### 🧠 Fase II: Inteligencia y Decisiones (Rondas 09 - 16)

- **Ronda 09: Finance Swarm**. Ledger inmutable y firma de transacciones.
- **Ronda 10: Legal Swarm**. Blindaje de IP y filtros GPL.
- **Ronda 11: Decision Gates**. Adversarial Test y simulacros de fallo.
- **Ronda 12: Anti-Sycophancy**. Crítica técnica obligatoria y desafío de órdenes.
- **Ronda 13: Vitals Monitor**. Conciencia de hardware (Temp/CPU).
- **Ronda 14: Session Persistence**. Integridad atómica de guardado.
- **Ronda 15: Navigator Intel**. Cartografía de dependencias circulares.
- **Ronda 16: Studio Composer**. Estandarización multimedia.

### 🛡️ Fase III: Blindaje y Seguridad Proactiva (Rondas 17 - 24)

- **Ronda 17: Sentinel Hub**. Dashboard de alertas en tiempo real.
- **Ronda 18: Code Scanner**. Análisis estático AST profunda.
- **Ronda 19: Permission Proxy**. Aislamiento virtual del FileSystem.
- **Ronda 20: Sentinel Shield**. Filtro de exfiltración de secretos.
- **Ronda 21: Audit Vault**. Logs inmutables firmados.
- **Ronda 22: Behavior Profile**. Heurística conductual de agentes.
- **Ronda 23: Supply Chain**. Vigilancia de dependencias (npm audit).
- **Ronda 24: Doctor Healing v2**. Auto-corrección vía `TSESTree`.

### 🚀 Fase IV: Excelencia y Sellado (Rondas 25 - 32)

- **Ronda 25: Guardian Integrity**. Firma del operador (PGP).
- **Ronda 26: Purify Master**. Gestión de ruido neural y purga.
- **Ronda 27: Honeypots**. Trampas internas para detección lateral.
- **Ronda 28: Executive Core**. Kernel en Rust contra inyecciones.
- **Ronda 29: Trust Score**. Ranking de fiabilidad de modelos.
- **Ronda 30: Adaptive Wallet**. Economía dinámica de tokens.
- **Ronda 31: Graph Intel Pro**. Detección de deriva arquitectónica.
- **Ronda 32: Ecosystem Lock**. Consolidación y certificación final.
- **Ronda 33: Veglia Hooks**. Migración de Husky a infraestructura nativa y proactiva.

---

## 5. Neural Index: Topología Detallada (100% Cobertura)

### Bloque 0: Raíz del Proyecto (Infraestructura)

- `.sognarc.json`: Constitución Operativa. Define el protocolo de comunicación (Usted/Operador/Español) y flags de gobernanza.
- `package.json`: Manifiesto de dependencias y scripts maestros.
- `turbo.json`: Configuración de pipeline de Turborepo.
- `.gitignore`: Reglas de exclusión de git.
- `.eslintrc.json`: Reglas de linting institucional.
- `tsconfig.json`: Configuración base de TypeScript.

### Bloque 1: Sognatore - Ejecución y Brain

- `Sognatore/src/core/BootstrapEngine.ts`: Orquestador de arranque secuencial.
- `Sognatore/src/core/Orchestrator.ts`: Planificador maestro de misiones.
- `Sognatore/src/core/MemoryHub.ts`: Punto de acceso único UMA.
- `Sognatore/src/core/Doctor.ts`: Autodiagnóstico y sanación.
- `Sognatore/src/core/Guardian.ts`: Guardián de secretos y firmas.
- `Sognatore/src/core/Cerebro.js`: Consola de mando interactiva (REPL).
- `Sognatore/src/core/brain/NexusBrain.ts`: Motor de razonamiento.
- `Sognatore/src/core/brain/NeuralRelay.ts`: Bus de eventos.

### Bloque 2: Sentinel - El Ecosistema de Seguridad

- `Sognatore/src/Sentinel-Sognatore/CodeScanner.ts`: Análisis AST.
- `Sognatore/src/Sentinel-Sognatore/PermissionProxy.ts`: Aislamiento FS.
- `Sognatore/src/Sentinel-Sognatore/Shield.ts`: Filtro de exfiltración.
- **Executive Core (Rust)**:
  - `Curator/executive-core/src/main.rs`: Punto de entrada kernel.
  - `Curator/executive-core/src/engine.rs`: Ejecución determinista.
  - `Curator/executive-core/src/classifier.rs`: Riesgo de comandos.
- **Veglia (Native Hooks)**:
  - `.veglia/`: Infraestructura nativa de hooks.
  - `Curator/engines/Sentinel/bin/veglia.js`: Orquestador proactivo y reparación vía IA.

### Bloque 3: Departamentos (The Swarm Network)

- **Finance**: `FinanceSwarm.ts`, `CostOptimizer.ts`, `FinanceLedger.ts`.
- **Legal**: `LegalSwarm.ts`, `ComplianceLead.ts`, `IPGuard.ts`.
- **Marketing**: `MarketingSwarm.ts`, `BrandArchitect.ts`, `CopyMaster.ts`.
- **Infrastructure**: `InfrastructureSwarm.ts`, `CloudArchitect.ts`, `DevOpsMaster.ts`.
- **Protection**: `ProtectionSwarm.ts`, `DefenseArchitect.ts`, `PrivacyGuardian.ts`.

### Bloque 4: Curator - Motores Técnicos

- **Navigator**: `analyze.py`, `audit.py`.
- **Studio**: `composer.py`, `video_utils.py`.
- **Predatore**: `scanner.py`, `exploit_gen.py`.
- **Animator**: Suite de tests kinéticos.
- **Assembler**: Blueprints y templates de generación.

### Bloque 5: Memory (UMA)

- `memory/identity/sogna.md`: Este archivo (SSOT).
- `memory/identity/rules.md`: Reglas operativas detalladas.
- `memory/operational/logs/history.md`: Registro de sesiones.
- `memory/intelligence/index.json`: Índice de conocimiento.

---

## 6. Glosario Técnico Maestro (The Sogna Lexicon)

- **Sognatore**: El Cerebro. Sistema operativo agéntico coordinador.
- **Sentinel**: El Escudo. Seguridad determinista y auditoría AST.
- **Executive Core**: El Kernel. Binario en Rust para inmutabilidad.
- **UMA (Unified Memory Architecture)**: La Memoria. Persistencia integrada.
- **Neural Relay**: El Bus. Mensajería asíncrona de alta fidelidad.
- **Decision Gates**: Las Puertas. Puntos de control crítico (Seguridad, Ética, Vitals).
- **Nexus Brain**: Motor de razonamiento superior.
- **Navigator**: Motor de análisis topográfico y detección de deriva.
- **Studio**: Suite multimedia para reportes visuales.
- **Predatore**: Motor de auditoría ofensiva.
- **Animator**: Motor de diseño kinético.
- **Turborepo Pipeline**: Orquestador de ejecución estándar.
- **Veto Proactivo**: Cancelación de comandos sospechosos por Sentinel.
- **Veglia**: El Centinela Proactivo. Sistema nativo de hooks con auto-reparación semántica.
- **Poda de Entropía**: Limpieza de memoria irrelevante.
- **RARV Protocol**: Research, Analysis, Review, Verification.
- **Dream Logic**: Razonamiento heurístico en fase de reposo.
- **Autonomía Operativa**: Estado funcional y seguro del ecosistema.
- **Monorepo Asimétrico**: Estructura de aislamiento de motores.
- **Trazabilidad Forense**: Reconstrucción de acciones vía logs firmados.
- **Sandboxing Virtual**: Aislamiento de FS por Permission Proxy.
- **Neural Pulse**: Mensaje único en el Neural Relay.
- **Heuristic Bloom**: Expansión de ideas en planificación.
- **Ghost Pattern**: Código residual sin función.
- **Security Parity**: Igualdad de seguridad entre JS y Rust.

---

## 7. Estado Operativo Actual (Reality Check)

- **Objetivo**: Hardening de configuración y entrada a la interfaz UI.
- **Estado de Swarms**: Sentinel (Activo), Predatore (Standby), Studio (Activo), Assembler (Activo).
- **Directiva**: *Build for the Second One.*

> [!IMPORTANT]
> **REGLA DE ORO DE CONTINUIDAD**
> Al finalizar cada sesión, el agente **DEBE** actualizar `memory/operational/logs/history.md` con los hitos alcanzados y las tareas pendientes para el próximo ciclo.

---

## LECCIONES OPERATIVAS

- **Seguridad**: Mejora en algoritmos de protección contra inyecciones y exfiltración.
- **Recursos**: Optimización en la gestión de memoria y CPU.
- **Arquitectura**: Implementación de Veglia y detección de deriva técnica.
- **Integridad**: Refuerzo de la infraestructura de auditoría y controles de Sentinel.