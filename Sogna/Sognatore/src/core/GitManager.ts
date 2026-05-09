import { Color, Exec } from '@Sogna/Curator';

import { Provider } from './Provider.js';

import path from 'path';

export class GitManager {
  constructor(
    private readonly cwd: string,
    private readonly provider: Provider
  ) {}

  /**
   * Genera un resumen de los cambios actuales y realiza un commit.
   */
  async commitLog(): Promise<boolean> {
    try {
      // 1. Obtener diff para análisis
      const { stdout: diff } = await Exec.run('git', ['diff', 'HEAD'], { cwd: this.cwd });
      
      if (!diff) {
        console.log(Color.dim('   ☁ No hay cambios para committear.'));
        return false;
      }

      console.log(Color.dim('   ☁ Generando resumen de cambios con IA...'));

      // 2. Pedir resumen a la IA
      const prompt = `
        Analyze the following git diff and generate a clear, professional, and concise commit message in Spanish.
        The message should summarize the key technical achievements and fixes.
        Format: "Sogna: [Summary]"
        
        DIFF:
        ${diff.substring(0, 4000)} // Truncar si es muy largo
      `;

      const summary = await this.provider.invoke(prompt, { tier: 'fast' });
      const cleanSummary = summary.trim().replace(/^'|'$/g, '').replace(/^"|"$/g, '');

      // 3. Ejecutar commit
      await Exec.run('git', ['add', '.'], { cwd: this.cwd });
      await Exec.run('git', ['commit', '-m', cleanSummary], { cwd: this.cwd });

      console.log(Color.green(`   ✔ Commit realizado: ${cleanSummary}`));
      return true;
    } catch (error: unknown) {
      console.error(Color.red(`   ⚠ Error en GitManager: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  /**
   * Realiza un commit manual si el automático falla o para backups rápidos.
   */
  async quickCommit(message: string) {
    await Exec.run('git', ['add', '.'], { cwd: this.cwd });
    await Exec.run('git', ['commit', '-m', message], { cwd: this.cwd });
  }
}
