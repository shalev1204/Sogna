#!/usr/bin/env node
import {
  dashboardUrl,
  openDashboard,
  runCheck,
  runConsolidationScheduled,
  runHologram,
  runMcpHealth,
  runSync,
  runUpForeground,
  startResident,
  stopServices,
} from "./runtime.mjs";

const cmd = (process.argv[2] || "help").toLowerCase();
const arg2 = (process.argv[3] || "").toLowerCase();

async function main() {
  let code = 0;
  switch (cmd) {
    case "on":
    case "encender":
      code = await startResident();
      if (code === 0 && arg2 !== "silent") {
        console.log("");
        console.log("[OK] Sogna en linea (modo residente).");
        console.log("     UMA API 8080 | UMA MCP 8000 | Bridge 8001");
        console.log(`     Dashboard: ${dashboardUrl}`);
      }
      break;
    case "off":
    case "apagar":
    case "down":
    case "stop":
      await stopServices();
      break;
    case "up":
      code = await runUpForeground();
      break;
    case "check":
      code = await runCheck();
      break;
    case "sync":
      code = await runSync();
      break;
    case "hologram":
    case "pulse":
      code = await runHologram();
      break;
    case "dashboard":
      code = await openDashboard();
      break;
    case "health":
    case "mcp-health":
      code = await runMcpHealth();
      break;
    case "consolidate":
      code = await runConsolidationScheduled();
      break;
    case "help":
    case "--help":
      printHelp();
      break;
    default:
      console.error(`[SOGNA ERROR] Comando desconocido: ${cmd}`);
      printHelp();
      code = 1;
  }
  process.exit(code);
}

function printHelp() {
  console.log(`
 SOGNA — Motor de control (cross-platform)
 ========================================

 Operador:
   ./Encender.sh | Encender.bat     on (segundo plano)
   ./Apagar.sh   | Apagar.bat       off

 Comandos:
   on|encender [silent]   Servicios residentes (8080, 8000, 8001, 5173)
   off|apagar             Detiene puertos
   up                     on + Bridge en primer plano
   check                  Diagnostico Sognatore
   sync                   Firma Sentinel + consolidate.py
   health                 verify-mcp-health.mjs
   dashboard              Abre panel :8001
   hologram|pulse         Telemetria de sesion
   consolidate            Pipeline UMA (tarea programada)

 macOS launchd: control/macos/install_launchd.sh
 Windows tareas: control/install_consolidation_task.ps1
`);
}

main().catch((err) => {
  console.error("[SOGNA ERROR]", err instanceof Error ? err.message : err);
  process.exit(1);
});
