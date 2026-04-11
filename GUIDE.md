# 🔱 Guía Maestra de Configuración: Loki Mode

¡Bienvenido al sistema de enjambres autónomos más potente! Para que Loki pueda operar a su máxima capacidad, necesitas configurar el sistema nervioso central: las **API Keys**.

---

## 1. 🔑 Pasaporte de APIs (Modo Híbrido)

Loki utiliza tres proveedores principales para equilibrar potencia, velocidad y costo.

### 🔵 Anthropic (Cerebro Platino)
- **Función**: Arquitectura, Auditoría de Seguridad y Consejo Final.
- **Obtención**: Ve a [Anthropic Console](https://console.anthropic.com/).
- **Variable**: `ANTHROPIC_API_KEY`

### 🔴 Google Gemini (Desarrollador Oro/Plata)
- **Función**: Codificación masiva, análisis de logs y tareas de eficiencia.
- **Obtención**: Ve a [Google AI Studio](https://aistudio.google.com/). Es extremadamente rápido y generoso en límites.
- **Variable**: `GOOGLE_API_KEY`

### 🟣 OpenAI (Especialista Versátil)
- **Función**: Tareas secundarias, razonamiento matemático y fallback.
- **Obtención**: Ve a [OpenAI Platform](https://platform.openai.com/api-keys).
- **Variable**: `OPENAI_API_KEY`

---

## 2. 🚀 Inicio Rápido con CLI

Ya no necesitas editar archivos a mano. Usa el poder del CLI:

### Configuración de Identidad
Ejecuta: `npm run start -- setup`
> Sigue los pasos del asistente para inyectar tus claves y configurar tus preferencias globales.

### Creación de un Nuevo Proyecto
Ejecuta: `npm run start -- init <nombre-del-proyecto>`
> Loki creará una carpeta independiente con su propio motor, aislada de otros experimentos.

---

## 3. 🔄 El Sistema de Actualización Inteligente

Tu proyecto es independiente, pero no está solo.

- **`upgrade`**: Cuando lanzamos mejoras al núcleo (bucle RARV, nuevos agentes), ejecuta `npm run start -- upgrade` en tu proyecto.
- **Seguridad**: El sistema hará un backup local y lo subirá a tu nube configurada antes de cambiar una sola línea de código del núcleo.

---

## 4. 📁 Estructura de Independencia

| Carpeta/Archivo | Propósito | ¿Se actualiza? |
| :--- | :--- | :--- |
| `src/core/` | El motor de Loki | **SÍ (Automático)** |
| `resources/config/` | Tus agentes personalizados | **NO (Protegido)** |
| `.env` | Tus claves secretas | **NO (Protegido)** |
| `prd.md` | El alma de tu proyecto | **NO (Protegido)** |

---

> [!TIP]
> **Autonomía Total**: Una vez configurado, puedes activar el **Modo Loki**. Solo dile: "Loki, toma el control y resuelve esta tarea". Él razonará, actuará y verificará por ti.
