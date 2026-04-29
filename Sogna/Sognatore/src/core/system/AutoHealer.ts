import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class AutoHealer {
  private static instance: AutoHealer;
  private _lastCheckTime: number = 0;
  private _lastResult: { status: string; fixed: boolean } | null = null;
  private readonly CHECK_TTL = 300000; // 5 minutes

  public static getInstance(): AutoHealer {
    if (!AutoHealer.instance) {
      AutoHealer.instance = new AutoHealer();
    }
    return AutoHealer.instance;
  }

  public async healBuildErrors(): Promise<{ status: string; fixed: boolean }> {
    if (this._lastResult && (Date.now() - this._lastCheckTime < this.CHECK_TTL)) {
      return this._lastResult;
    }
    console.log(chalk.yellow('[AUTO_HEALER] Verificando estado de compilación...'));
    try {
      await execAsync('npx tsc --noEmit');
      this._lastCheckTime = Date.now();
      this._lastResult = {
        status: 'No se detectaron errores de compilación en TypeScript.',
        fixed: false
      };
      return this._lastResult;
    } catch (error: any) {
      console.log(chalk.red('[AUTO_HEALER] Detectado error de compilación. Intentando auto-reparación...'));
      
      // Intentar reinstalar dependencias faltantes
      try {
        await execAsync('npm install');
        await execAsync('npx tsc --noEmit');
        this._lastCheckTime = Date.now();
        this._lastResult = {
          status: 'Error reparado mediante reinstalación limpia de dependencias.',
          fixed: true
        };
        return this._lastResult;
      } catch (e) {
        this._lastCheckTime = Date.now();
        this._lastResult = {
          status: 'Fallo al auto-reparar. Se requiere intervención manual.',
          fixed: false
        };
        return this._lastResult;
      }
    }
  }
}
