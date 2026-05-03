import { execa } from 'execa';
import { Provider } from './provider.js';
import chalk from 'chalk';
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
      const { stdout: diff } = await execa('git', ['diff', 'HEAD'], { cwd: this.cwd });
      
      if (!diff) {
        console.log(chalk.dim('   ☁ No hay cambios para committear.'));
        return false;
      }

      console.log(chalk.dim('   ☁ Generando resumen de cambios con IA...'));

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
      await execa('git', ['add', '.'], { cwd: this.cwd });
      await execa('git', ['commit', '-m', cleanSummary], { cwd: this.cwd });

      console.log(chalk.green(`   ✔ Commit realizado: ${cleanSummary}`));
      return true;
    } catch (error: unknown) {
      console.error(chalk.red(`   ⚠ Error en GitManager: ${error instanceof Error ? error.message : String(error)}`));
      return false;
    }
  }

  /**
   * Realiza un commit manual si el automático falla o para backups rápidos.
   */
  async quickCommit(message: string) {
    await execa('git', ['add', '.'], { cwd: this.cwd });
    await execa('git', ['commit', '-m', message], { cwd: this.cwd });
  }
}
