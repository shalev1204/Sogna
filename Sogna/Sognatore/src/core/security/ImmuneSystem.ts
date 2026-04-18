import fs from 'fs-extra';
import path from 'path';
import { SwarmOrchestrator } from '../SwarmOrchestrator.js';
import chalk from 'chalk';

export interface HealingReport {
  timestamp: string;
  sourceFile: string;
  vulnerability: string;
  fixApplied: boolean;
  testGenerated: boolean;
  details: string;
}

/**
 * Sognatore Immune System - The Active Self-Healing Engine
 * Automatically generates and applies security patches + tests after a Sentinel veto.
 */
export class ImmuneSystem {
  private static instance: ImmuneSystem;
  private reportsDir: string;

  private constructor(baseDir: string = '.') {
    this.reportsDir = path.resolve(baseDir, 'memory', 'security', 'vaccines');
  }

  public static getInstance(): ImmuneSystem {
    if (!ImmuneSystem.instance) {
      ImmuneSystem.instance = new ImmuneSystem();
    }
    return ImmuneSystem.instance;
  }

  /**
   * Triggers the healing process for a specific veto report.
   */
  async triggerHealing(vetoDetails: string): Promise<HealingReport> {
    await fs.ensureDir(this.reportsDir);
    console.log(chalk.blue.bold('\n[IMMUNE_SYSTEM] Intrusión detectada. Iniciando protocolo de autocuración...'));

    const orchestrator = SwarmOrchestrator.getInstance();
    
    // Step 1: Analyze the veto and generate a fix + test
    const healingTask = `
      ACTÚA COMO UN EXPERTO EN CIBERSEGURIDAD (ELITE HARDENER).
      Analiza el siguiente reporte de veto de Sentinel y genera:
      1. Un parche de seguridad (diff o código corregido) para el archivo afectado.
      2. Un test de regresión (en Jest/TS) que verifique que la vulnerabilidad ya no es explotable.
      
      REPORTE DE VETO:
      ${vetoDetails}
      
      Formato de respuesta: JSON con campos { "file": string, "fix": string, "test": string, "explanation": string }
    `;

    try {
      const response = await orchestrator.dispatchTask({
        id: `heal-${Date.now()}`,
        type: 'sec-hardener',
        description: healingTask,
        priority: 10,
        status: 'pending'
      });

      const result = JSON.parse(response);
      
      // Step 2: Apply the fix automatically (User Directive)
      await this.applyFix(result.file, result.fix);
      
      // Step 3: Save the "Vaccine" (Test)
      const testPath = await this.saveTest(result.file, result.test);

      const report: HealingReport = {
        timestamp: new Date().toISOString(),
        sourceFile: result.file,
        vulnerability: 'Sentinel Veto Detection',
        fixApplied: true,
        testGenerated: true,
        details: result.explanation
      };

      await this.logHealing(report);
      
      console.log(chalk.green(`[IMMUNE_SYSTEM] ✅ Parche aplicado en: ${result.file}`));
      console.log(chalk.cyan(`[IMMUNE_SYSTEM] 💉 Vacuna (test) generada en: ${testPath}`));
      
      return report;
    } catch (error) {
       console.error(chalk.red('[IMMUNE_SYSTEM] Error durante el proceso de autocuración:'), error);
       throw error;
    }
  }

  private async applyFix(filePath: string, fixCode: string): Promise<void> {
    const fullPath = path.resolve(process.cwd(), filePath);
    // In a real implementation, we would use a more sophisticated diff/patch application
    // For now, we assume the agent provides the full corrected file or a clear replacement
    await fs.writeFile(fullPath, fixCode, 'utf-8');
  }

  private async saveTest(sourceFile: string, testCode: string): Promise<string> {
    const fileName = `vaccine_${path.basename(sourceFile).replace(/\.(ts|js)$/, '')}_${Date.now()}.test.ts`;
    const testPath = path.join(this.reportsDir, fileName);
    await fs.writeFile(testPath, testCode, 'utf-8');
    return testPath;
  }

  private async logHealing(report: HealingReport): Promise<void> {
    const logPath = path.join(this.reportsDir, 'healing_registry.jsonl');
    await fs.appendFile(logPath, JSON.stringify(report) + '\n', 'utf-8');
  }
}
