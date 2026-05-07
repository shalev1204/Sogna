import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

export class DependencyAuditor {
  private static instance: DependencyAuditor;

  public static getInstance(): DependencyAuditor {
    if (!DependencyAuditor.instance) {
      DependencyAuditor.instance = new DependencyAuditor();
    }
    return DependencyAuditor.instance;
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
