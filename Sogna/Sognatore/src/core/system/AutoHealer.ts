import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class AutoHealer {
  private static instance: AutoHealer;

  public static getInstance(): AutoHealer {
    if (!AutoHealer.instance) {
      AutoHealer.instance = new AutoHealer();
    }
    return AutoHealer.instance;
  }

  public async healBuildErrors(): Promise<{ status: string; fixed: boolean }> {
    console.log(chalk.yellow('[AUTO_HEALER] Verificando estado de compilación...'));
    try {
      await execAsync('npx tsc --noEmit');
      return {
        status: 'No se detectaron errores de compilación en TypeScript.',
        fixed: false
      };
    } catch (error: any) {
      console.log(chalk.red('[AUTO_HEALER] Detectado error de compilación. Intentando auto-reparación...'));
      
      // Intentar reinstalar dependencias faltantes
      try {
        await execAsync('npm install');
        await execAsync('npx tsc --noEmit');
        return {
          status: 'Error reparado mediante reinstalación limpia de dependencias.',
          fixed: true
        };
      } catch (e) {
        return {
          status: 'Fallo al auto-reparar. Se requiere intervención manual.',
          fixed: false
        };
      }
    }
  }
}
