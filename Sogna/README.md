# 🧠 SOGNA: Ecosistema Operativo e Integración UMA

> **Directiva**: *"Build for the Second One."*
> **Clasificación**: Entorno Operativo Institucional - Nivel de Seguridad Máximo (Tier L3)
> **Identidad SSOT**: Sogna Core Active

## 🗺️ Mapa de Navegación de Capa 1

El directorio raíz de **Sogna** ha sido meticulosamente estructurado y consolidado bajo estándares institucionales para asegurar una clara separación de responsabilidades y prevenir cualquier ruteo semántico fantasma o duplicaciones de caché.

```
c:\Users\carle\Desktop\Sogna\Sogna
├── 📂 control/              # Panel de Control Central (Scripts batch, VBS launchers y portal)
├── 📂 Curator/              # Cerebro y capacidades de los agentes (Skills, Workflows, Reglas, Scripts)
├── 📂 Sognatore/            # Motor de Orquestación de Red Neuronal y Servidores Telemetría (TypeScript)
├── 📂 memory/               # Almacenamiento Unificado (SSOT, Grafo de Conocimiento, ChromaDB, Episódica)
├── 📂 branding/             # Actas de análisis institucional y recursos gráficos de marca
├── 📂 scratch/              # Scripts de auditoría rápida y herramientas de desarrollo temporal
├── 📂 .venv/                # Entorno virtual de Python dedicado para procesos de IA locales
├── 📂 .veglia/              # Ganchos y políticas de pre-commit securizados por Sentinel
├── 📂 node_modules/         # Dependencias externas del ecosistema de Node.js
├── 📄 .sognarc.json         # Configuración del Gobierno de Swarm y permisos de ejecución
└── 📄 package.json          # Registro de scripts de NPM y dependencias principales
```

---

## 📂 Desglose de Carpetas Críticas

### 1. 📂 `control` (Panel de Control)
Interfaz mínima para el operador. Ver `control/README.md`.
*   **`Encender.bat` / `Apagar.bat`**: encendido y apagado manual (reserva).
*   **`Sogna_App.vbs`**: arranque automático al iniciar Windows (MCP residentes).
*   **`Sogna.bat`**: motor interno (`Sogna.bat on|off|check|sync` desde `control\`).
*   **`dashboard/`**: panel web en :8001.
*   **`docs/`**: pulse, portal y guías.

### 2. 📂 `Curator` (Orquestación del Conocimiento de Agentes)
El motor de ejecución de habilidades y workflows. Es el **único** lugar donde residen los superpoderes de los agentes.
*   **`/skills`**: Catálogo unificado de habilidades operativas (p. ej., `consulta-memoria`, `intelligent-routing`, `clean-code`).
*   **`/workflow`**: Rutinas secuenciales de ejecución de tareas (p. ej., `start.md` para el despertar, `deploy.md`, `ui-ux.md`).
*   **`/rules`**: Directrices deterministas de comportamiento e integridad de código (`GEMINI.md`, `MEMORIA_UMA.md`).
*   **`/scripts`**: Utilidades y demonios de automatización interna (p. ej., `auto_config_mcp.py`, `SognaSanitizer.py`).

### 3. 📂 `Sognatore` (Motor de Integración Neuronal)
Orquestador técnico de la red y servicios reactivos en NodeJS/TypeScript.
*   **`/src/core`**: Contiene el `MemoryHub.ts`, `Chronicler.ts` y componentes del Swarm Orchestrator.
*   **`/src/observability`**: Servidores de telemetría y ruteo de eventos semánticos en tiempo real (CloudEvents 1.0).

### 4. 📂 `memory` (Memoria de Acceso Universal - UMA)
El repositorio de datos persistente que nutre de resonancia semántica al enjambre.
*   **`/identity`**: Estándares, manifiestos del proyecto y el servidor MCP (`mcp_uma_server.py`).
*   **`/operational/synapses`**: Historial de handshakes de motores y conexiones inter-swarm verificadas.
*   **`/security`**: Base de datos de vacunas contra la inyección de código y telemetría de amenazas de Sentinel.

---

## ⚡ Protocolo de Arranque y Control

Sogna está diseñado para ejecutarse de forma ágil mediante automatizaciones invisibles en Windows:

### Acciones Rápidas del Operador

| Acción | Cómo |
| :--- | :--- |
| **Auto** | `Sogna_App.vbs` en Inicio de Windows (ya configurado si existe el acceso directo) |
| **Encender (manual)** | `control/Encender.bat` |
| **Apagar (manual)** | `control/Apagar.bat` |
| **Diagnóstico** | `control\Sogna.bat check` |
| **Sincronizar** | `control\Sogna.bat sync` |
| **Panel** | `control\Sogna.bat dashboard` |

---

## 🔒 Gobierno del Ecosistema (.sognarc.json)

El gobierno operativo de Sogna se autogestiona mediante el archivo de configuración `.sognarc.json` que aplica:
- **Redacción de PII**: Anonimización estricta del nombre del Operador (`carle` -> `[OPERATOR]`) en logs y metadatos.
- **Veto de Sentinel**: Auditorías de seguridad y cálculo de entropía automáticos en cada refactorización.
- **Cuotas de Recursos**: Límite del 80% de CPU y 8GB de RAM máximos para evitar cuellos de botella en la PC local.

---

> [!NOTE]
> **Integridad y Hardening**:
> Todos los accesos a la capa de memoria local pasan por un proceso de saneamiento en `MemoryHub`. Cualquier intento de búsqueda de credenciales desata un bloqueo neuronal de Sentinel que detiene inmediatamente los subprocesos para garantizar un entorno blindado.
