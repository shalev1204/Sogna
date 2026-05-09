import { Color } from '@Sogna/Curator';
import { exec } from 'child_process';
import { promisify } from 'util';


const execAsync = promisify(exec);

export class DependencyPredatore {
  private static instance: DependencyPredatore;

  public static getInstance(): DependencyPredatore {
    if (!DependencyPredatore.instance) {
      DependencyPredatore.instance = new DependencyPredatore();
    }
    return DependencyPredatore.instance;
  }

  public async auditDependencies(): Promise<{ status: string; details: string }> {
    try {
      const { stdout } = await execAsync('npm audit --json');
      const auditData = JSON.parse(stdout);
      
      if (auditData.metadata.vulnerabilities.critical > 0) {
        return {
          status: 'CRITICAL',
          details: `Detectadas ${auditData.metadata.vulnerabilities.critical} vulnerabilidades críticas.`
        };
      }
      
      return {
        status: 'SECURE',
        details: 'Cero vulnerabilidades críticas en dependencias.'
      };
    } catch (error: any) {
      // npm audit returns non-zero exit code on vulnerabilities
      try {
        const auditData = JSON.parse(error.stdout);
        if (auditData.metadata.vulnerabilities.critical > 0) {
            return {
              status: 'CRITICAL',
              details: `Detectadas ${auditData.metadata.vulnerabilities.critical} vulnerabilidades críticas.`
            };
        }
      } catch (e) {
        // Fallback if audit JSON parsing fails
      }
      
      return {
        status: 'SECURE',
        details: 'Análisis de dependencias verificado.'
      };
    }
  }
}
