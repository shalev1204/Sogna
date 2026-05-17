# 🌌 SOGNA: Portal de Entradas y Control de Operaciones

> **Ecosistema**: Sogna Core Active
> **Última Resonancia**: 2026-05-17
> **Modo**: Unlimited Memory Access (UMA)

---

## ⚡ Panel de Control Rápido

Estos scripts de orquestación localizados en `control/` gobiernan los motores de Sogna de manera segura e invisible:

*   🟢 **[Sogna_App.vbs](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/Sogna_App.vbs)**: Ignición silenciosa del Servidor UMA (ChromaDB + Grafo) en segundo plano.
*   🔴 **[Sogna_Stop.bat](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/Sogna_Stop.bat)**: Apagado e interrupción del puerto `8000` con limpieza de memoria.
*   💻 **[Sogna.bat](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/Sogna.bat)**: Ejecución en consola visible para depuración de queries.
*   🌉 **[sogna_bridge.bat](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/sogna_bridge.bat)**: Enlace de comunicación de Antigravity via SSE.
*   ⚙️ **[enable_startup.bat](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/enable_startup.bat)**: Configura el inicio automático al encender o reiniciar el ordenador.
*   ❌ **[disable_startup.bat](file:///C:/Users/carle/Desktop/Sogna/Sogna/control/disable_startup.bat)**: Desactiva el inicio automático y remueve el acceso directo de forma limpia.

---

## 🧭 Puntos de Entrada Clave

| Componente | Directorio / Archivo | Función Operativa |
| :--- | :--- | :--- |
| 🛡️ **Sentinel** | `Curator/engines/Sentinel/` | Monitoreo de integridad de código y detección de inyecciones. |
| 🧬 **Sognatore** | `Sognatore/src/core/` | Motor de orquestación de la red y telemetría de eventos. |
| 🧠 **Memory Hub** | `memory/` | Almacenamiento unificado de grafo de conocimiento y vectores. |
| 📜 **Rules SSOT** | `Curator/rules/GEMINI.md` | Directivas maestras de comportamiento de la IA. |
| 📝 **Identity SSOT** | `memory/identity/sogna.md` | Constitución y misión a largo plazo del sistema. |

---

## 🏁 Protocolo de Arranque Manual de Servicios

Si desea iniciar la interfaz web y el orquestador NodeJS de forma manual:

1.  **Instalar Dependencias**:
    ```bash
    pnpm install --root
    ```
2.  **Arranque del Orquestador Sognatore**:
    ```bash
    pnpm sognatore:core
    ```
    *(Escucha peticiones reactivas en el puerto `8081`)*
3.  **Arranque del Dashboard Web**:
    ```bash
    cd Curator/apps/sogna-web && pnpm run dev
    ```
    *(Interfaz visual premium accesible en el puerto `5173`)*

---

> [!NOTE]
> **Manifiesto de Integridad**:
> Cualquier modificación en los archivos de la capa core requiere la re-generación de firmas digitales en `Curator/engines/Sentinel/data/signatures.json` para evitar vetos automáticos del sistema.
