# 🛠️ SOGNA: Catálogo de Comandos Operativos

Este archivo contiene todos los comandos funcionales disponibles en el ecosistema Sogna, organizados por su propósito y motor de ejecución.

---

## 🚀 Comandos Principales (Sognatore)

Estos comandos controlan el corazón del sistema y la orquestación de agentes.

| Comando | Ejecución | Descripción |
| :--- | :--- | :--- |
| **Sognatore** | `pnpm run Sognatore` | Inicia el **enjambre de agentes autónomos**. Es el comando principal para activar la inteligencia operativa de Sogna. |
| **Sogna** | `pnpm run Sogna` | Ejecuta el motor **Curator**. Se encarga de la orquestación institucional y la gestión del ecosistema. |
| **dream** | `pnpm run dream` | Punto de entrada para la **creación de mundos**, clonación e inicialización de nuevos proyectos dentro de Sogna. |
| **sync** | `pnpm run sync` | Sincroniza la memoria del sistema y la arquitectura **UMA** (Unlimited Memory Architecture). |

---

## 🛡️ Control de Calidad y Seguridad (Sentinel)

Comandos encargados de mantener la integridad y el rigor del código.

| Comando | Ejecución | Descripción |
| :--- | :--- | :--- |
| **check** | `pnpm run check` | Realiza una verificación de tipos completa (TypeScript) en todo el monorepo usando Turbo. |
| **lint** | `pnpm run lint` | Ejecuta el análisis estático de código para asegurar que cumple con las reglas de estilo de Sogna. |
| **test** | `pnpm run test` | Lanza la suite de pruebas unitarias y de integración de todos los motores. |
| **verify** | `node Curator/bin/verify.js` | Ejecuta los scripts de **verificación institucional** para validar el estado del sistema. |

---

## 🏗️ Construcción y Desarrollo

Herramientas para la compilación y mantenimiento del entorno.

| Comando | Ejecución | Descripción |
| :--- | :--- | :--- |
| **build** | `pnpm run build` | Compila todo el proyecto usando **Turbo**. Genera las versiones ejecutables en las carpetas `dist/`. |
| **dev** | `pnpm run dev` | Inicia el entorno de desarrollo rápido (Vite) para las interfaces de usuario. |
| **clean** | `pnpm run clean` | Limpia los artefactos de construcción y cachés antiguas para un estado fresco. |
| **graph** | `pnpm run graph` | Genera una visualización gráfica de las dependencias y tareas de Turbo. |

---

## 🔧 Utilidades de Curator (Binarios)

Scripts especializados para el mantenimiento de habilidades y memoria.

| Comando | Ejecución | Descripción |
| :--- | :--- | :--- |
| **purify** | `node Curator/bin/purify.js` | Limpia y refina la base de datos de memoria y conocimientos. |
| **refine-skill** | `node Curator/bin/refine-skill.js` | Optimiza una habilidad específica de un agente para mejorar su rendimiento. |
| **organize-skills** | `node Curator/bin/organize-skills.js` | Reorganiza el catálogo de habilidades para mantener la estructura lógica de Sogna. |

---

> [!TIP]
> **Uso de Turbo:** La mayoría de los comandos (build, check, test, lint) utilizan **Turborepo** para ejecutarse en paralelo de forma ultra-rápida. Si quieres ejecutar un comando en un paquete específico, puedes usar: `pnpm run <comando> --filter <paquete>`.
