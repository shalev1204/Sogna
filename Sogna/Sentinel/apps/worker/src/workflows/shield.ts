import { proxyActivities, log } from '@temporalio/workflow';
// Sólo importamos los tipos de las actividades.
import type * as activities from '../activities';

const { checkOSVDatabase } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3, // Tolerancia a fallos de red
  },
});

export async function SupplyChainShieldWorkflow(packages: Record<string, string>, ecosystem: string = 'npm'): Promise<any[]> {
  log.info(`[SENTINEL SHIELD WORKFLOW] Iniciando auditoría de suministro temporal...`);
  
  // Realiza la llamada robusta a la actividad que interroga la OSV.
  const vulnerabilidades = await checkOSVDatabase(packages, ecosystem);
  
  if (vulnerabilidades.length > 0) {
    log.error(`[SENTINEL SHIELD] ¡Brecha detectada! ${vulnerabilidades.length} paquetes comprometidos.`);
    // En el futuro, aquí interconectaremos la actividad `writeThreatIntel`
    // para autogenerar el reporte en Markdown.
  } else {
    log.info(`[SENTINEL SHIELD] Ecosistema purgado y limpio.`);
  }

  return vulnerabilidades;
}
