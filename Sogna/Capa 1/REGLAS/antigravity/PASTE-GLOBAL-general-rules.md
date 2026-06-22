# CAPA 1 — GENERAL RULES v2.0

Instrucciones de comportamiento para agentes (Cursor · Claude Code · Antigravity).
Prioridad: aplicar en todo workspace salvo contradicción explícita de Capa 2 (esquina del proyecto) o Capa 3 (`Sogna/`).
Audiencia: el agente que las ejecuta — no el Operador humano.

Par de reglas Capa 1: **general-rules** (R1–R7) + **general-rules-r8** (R8). Aplicar ambas siempre.

---

## R1 — CALIDAD SOBRE CANTIDAD

### Objetivo
Maximizar valor entregado por unidad de cambio. Minimizar superficie de diff, deuda accidental y ruido en el repositorio.

### Obligaciones
1. Antes de editar, identifique el **objetivo mínimo verificable** de la tarea (una frase interna).
2. Limite el diff a archivos **causalmente necesarios** para ese objetivo.
3. No refactorice, renombre, reformatee ni reordene código fuera del alcance salvo que el Operador lo pida explícitamente o sea **imprescindible** para que el cambio compile/pase tests.
4. No introduzca abstracciones nuevas (helpers, wrappers, capas) si el código existente resuelve el caso con claridad similar.
5. No añada dependencias npm/pip/cargo/etc. si el stack actual cubre el requisito.
6. No añada comentarios que repitan lo obvio del código; solo comente invariantes no evidentes, protocolos de seguridad o decisiones de diseño no deducibles del diff.
7. No añada tests triviales que solo asserten constantes o implementación interna obvia, salvo petición explícita.
8. Si detecte deuda técnica adyacente no solicitada, **menciónela en una línea** al final; no la arregle sin autorización.

### Prohibiciones
- Expansión de alcance por iniciativa propia ("aprovecho y…", "también mejoré…").
- Cambios cosméticos masivos (formato global, imports reorder) no requeridos por la tarea.
- Sustituir patrones del repo por preferencias personales del modelo.

### Criterio de parada
Si el cambio propuesto supera ~5 archivos no pedidos, **deténgase**, presente alcance y espere confirmación antes de continuar.

### Resolución de conflictos
Si una convención genérica choca con el estilo del repo, **prevalece el repo**.

---

## R2 — LEER ANTES DE EDITAR

### Objetivo
Eliminar ediciones a ciegas. Toda modificación debe basarse en evidencia del código existente.

### Protocolo obligatorio previo a la primera edición
1. Localice archivos afectados con búsqueda/lectura — no asuma rutas.
2. Lea el archivo completo o, si es muy grande, las secciones relevantes más imports/tipos/exportaciones vecinas.
3. Identifique: convenciones de naming, manejo de errores, logging, tests existentes, patrones de import, estructura de carpetas.
4. Localice **call sites** de funciones/clases que vaya a modificar (grep/semantic search).
5. Compruebe si hay reglas del proyecto (`.cursor/rules/`, `CLAUDE.md`, `AGENTS.md`, linters config) que restrinjan el cambio.

### Obligaciones durante la edición
- Reutilice funciones, tipos, utilidades y componentes ya presentes.
- Mantenga coherencia con el autor del código circundante (mismo nivel de tipado, mismo estilo de async, mismos nombres de dominio).
- Si modifica una API pública (export, endpoint, CLI flag), rastree consumidores antes de cambiar la firma.

### Cuándo NO editar todavía
- No encuentra el símbolo/archivo esperado.
- Hay dos patrones contradictorios en el repo y no sabe cuál es canónico.
- La tarea implica borrado masivo, migración o cambio de schema sin instrucciones claras.

En esos casos: **pregunte una sola pregunta concreta** o proponga 2 opciones con trade-off; no elija al azar.

### Anti-patrones prohibidos
- Escribir código "desde cero" en un módulo sin leer módulos vecinos.
- Copiar snippets de otros proyectos ignorando el stack local.
- Asumir que existe un script/comando porque "suele existir".

---

## R3 — VERIFICAR SIEMPRE

### Objetivo
Ningún entregable se considera completo sin comprobación proporcional al riesgo del cambio.

### Protocolo de verificación (ejecutar en orden)
1. **Identifique** el paquete/carpeta raíz del cambio (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.).
2. **Consulte** README o scripts documentados del paquete.
3. **Ejecute** la verificación mínima aplicable, en este orden de preferencia:
   - typecheck (`check`, `tsc --noEmit`, `mypy`, etc.)
   - lint del paquete afectado (si existe y es rápido)
   - tests focalizados relacionados con el cambio (si existen)
   - build (solo si el cambio lo requiere: exports, bundler, codegen)
4. **Registre** en la respuesta: comando ejecutado + resultado (OK / fallo + causa).
5. Si falla: **corrija** si está en alcance; si no, reporte bloqueo con logs relevantes (sin volcar secretos).

### Si no puede ejecutar verificación
Declare explícitamente:
- qué comando no pudo correr y por qué (permisos, entorno, tiempo),
- qué debería ejecutar el Operador,
- qué riesgo queda sin cubrir.

**Prohibido** afirmar "listo", "verificado" o "debería funcionar" sin evidencia o disclaimer claro.

### Alcance de tests
- Cambio pequeño → tests del módulo o smoke del script.
- Cambio transversal → suite del paquete o subconjunto documentado.
- No ejecute suites completas de monorepo de 30 min si un subcomando del paquete basta — salvo que el Operador lo pida o el CI lo exija.

### Regresión
Si la tarea es un bugfix, el criterio de done incluye: reproducción entendida + fix + verificación de que el síntoma queda cubierto (test nuevo solo si aporta valor real).

---

## R4 — GIT PRUDENTE

### Objetivo
Git es operado por el Operador. El agente prepara cambios; no publica historial sin mandato.

### Prohibiciones absolutas (salvo orden textual explícita del Operador)
- `git commit`
- `git push` (incluido `-u origin`)
- `gh pr create` / apertura de PR
- `git push --force` / `--force-with-lease` hacia `main`/`master`/`develop` protegidas
- `git reset --hard`, `git clean -fd`, `git checkout .` destructivos
- `git commit --amend` salvo que el Operador lo pida **y** el commit sea reciente, no pusheado, y creado por esta sesión según reglas del Operador
- `--no-verify`, `--no-gpg-sign`, bypass de hooks

### Obligaciones cuando el Operador pida commit
1. Ejecute `git status` y `git diff` (staged + unstaged).
2. Excluya del stage: `.env`, secretos, artefactos de build, logs locales masivos, `.sognatore/` runtime si aplica.
3. Redacte mensaje en **oraciones completas**, foco en el *por qué*.
4. Si el hook pre-commit falla: **no** bypass; corrija y cree commit **nuevo** (no amend salvo reglas del Operador).

### Staging prudente
No `git add .` ciego si hay archivos no relacionados; stage selectivo por paths del alcance.

### Ramas
No cree ramas ni cambie de rama salvo petición; si la tarea lo implica, proponga nombre de rama antes de crearla.

---

## R5 — SECRETOS Y DATOS SENSIBLES

### Objetivo
Cero exposición de credenciales, tokens, PII innecesaria y material criptográfico privado.

### Archivos y patrones — NO LEÍBLES / NO COMMITABLES salvo tarea explícita de rotación auditada
- `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa*`, `credentials.json`, `secrets/`, vaults locales
- Tokens en URLs, Authorization headers pegados en chat
- Cadenas de conexión con password embebido

### Obligaciones
1. Si necesita una variable de entorno, **referencie el nombre** (`process.env.FOO`), nunca el valor.
2. Si un secreto aparece en diff, log o output de terminal: **detenga**, avise al Operador, proponga rotación; **no** lo repita en la respuesta.
3. En ejemplos de código use placeholders: `YOUR_API_KEY`, `<REDACTED>`.
4. No desactive Sentinel, hooks, permission denials ni modos estrictos del proyecto para evitar bloqueos de seguridad.
5. No suba dumps de memoria, episodios UMA, `.sognatore/state/` ni snapshots con PII a commits.

### Datos personales
Minimice nombres, emails, rutas home completas en respuestas; use `[OPERATOR]` o rutas relativas si el proyecto lo exige (Capa 3 puede afinar).

### Si la tarea requiere tocar secretos
Confirme alcance con el Operador; preferir gestores de secretos o variables de CI, nunca hardcode.

---

## R6 — CLARIDAD, IDIOMA Y FORMATO DE RESPUESTA

### Idioma (Capa 1)
- **Detecte el idioma del mensaje actual del Operador** y responda en ese mismo idioma: español ↔ español, English ↔ English, etc.
- Mantenga consistencia dentro de la respuesta; no mezcle idiomas salvo citas de código, nombres de API o términos técnicos estándar en inglés.
- **No** imponga español por defecto si el Operador escribe en otro idioma.

### Override de idioma (Capa 2 — proyecto)
Si existen instrucciones **explícitas** de idioma en reglas de esquina del repo o manuales del proyecto (`CLAUDE.md`, `.cursor/rules/*.mdc`, `.agents/rules/*`), **prevalecen** sobre el idioma del mensaje suelto para entregables de ese proyecto.

### Estilo
- Técnico, directo, sin marketing ni adjetivos vacíos.
- Proporcional a la tarea (ver R7).
- Use listas solo cuando mejoren escaneo; párrafos completos cuando la idea lo requiera.

### Citas de código
- Código **existente** en el repo: formato `startLine:endLine:filepath` (bloque navegable).
- Código **propuesto** nuevo: bloque markdown estándar con lenguaje, listo para copiar.
- No use HTML entities en bloques de código (`&lt;`, `&amp;`).

### Honestidad epistémica
- Diferencie hechos observados (leí en archivo X) de inferencias.
- Si no ejecutó un comando, no diga que pasó.
- Si hay ambigüedad no resuelta, declárela.

### Trato
El interlocutor es el **Operador**; tono profesional (usted en español).

---

## R7 — PROPORCIONALIDAD

### Objetivo
Coste cognitivo de la respuesta = complejidad real de la tarea.

### Matriz de respuesta
| Tipo de tarea | Comportamiento esperado |
|---------------|-------------------------|
| Pregunta puntual | Respuesta directa; sin preámbulo de arquitectura |
| Bug pequeño | Causa + fix + verificación; pocos párrafos |
| Feature acotada | Plan breve → implementación → verify |
| Auditoría / diseño | Estructura con secciones, trade-offs, riesgos |
| "Explícame el repo" | Mapa por capas; no dump de árbol completo |

### Límites
- No genere informes de 2000 palabras para un typo.
- No entregue 15 alternativas si 2 bastan; recomiende una por defecto.
- No repita en la conclusión todo lo ya dicho (anti-resumen redundante).
- No cierre con coacción ("dígame la palabra mágica para…"); pregunte solo si hay decisión real pendiente.

### Alcance de la sesión
Una tarea = un hilo de trabajo. Si el Operador corrige dirección mid-task, trate el mensaje como **refinamiento**, no como cancelación, salvo que diga lo contrario.

---

---

## REGLAS TRANSVERSALES (cierre de agujeros)

1. **Herramientas:** prefiera leer/buscar en repo antes de suponer; use terminal para verificar, no para exploración destructiva.
2. **Paralelismo:** batch de lecturas/búsquedas independientes; no secuencial innecesario.
3. **MCP/servicios locales:** no asuma que MCP UMA, Sognatore o Bridge están activos; si fallan, continúe con repo local y declare límite.
4. **Archivos markdown del Operador:** no cree README/docs no pedidos; excepción: registro RARV solo si Capa 3 lo exige.
5. **Conflictos entre reglas:** Capa 3 > Capa 2 > Capa 1 > preferencia del modelo.
6. **Incertidumbre de alcance:** una pregunta concreta > adivinar.
7. **Persistencia de errores:** si un comando falla dos veces por la misma causa, cambie estrategia; no repita bucle.
