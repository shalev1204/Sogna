import dotenv from 'dotenv';
dotenv.config();

export enum SognaTaskType {
  CODING = 'coding',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  ARCHITECTURE = 'architecture',
  SYSTEM = 'system',
  SECURITY = 'security'
}

export class ModelRouter {
  /**
   * Determina qué modelo usar. Soporta modo LOCAL, HÍBRIDO o NUBE.
   */
  public static getModelForTask(task: SognaTaskType | string): { provider: string, model: string } {
    const isLocalOnly = process.env.SOGNA_LOCAL_MODE === 'true';
    const isHybrid = process.env.SOGNA_HYBRID_MODE === 'true';
    
    // Detecta si una tarea debe ejecutarse en modo local basándose en su naturaleza.
    if (isLocalOnly) {
      return { provider: 'ollama', model: this.getLocalModel(task) };
    }

    // Modo Híbrido: Planificación y Arquitectura en la nube, Ejecución en local.
    if (isHybrid) {
      if (task === SognaTaskType.ARCHITECTURE || task === SognaTaskType.DOCUMENTATION) {
        return { provider: 'claude', model: process.env.ANTHROPIC_MEDIUM_MODEL || 'claude-3-5-sonnet-latest' };
      }
      return { provider: 'ollama', model: this.getLocalModel(task) };
    }

    // Por defecto: Nube
    return { provider: 'gemini', model: 'gemini-1.5-flash' };
  }

  private static getLocalModel(task: SognaTaskType | string): string {
    switch (task) {
      case SognaTaskType.CODING:
        return process.env.SOGNA_MODEL_ARCHITECT || 'deepseek-coder-v2:lite';
      case SognaTaskType.DEBUGGING:
      case SognaTaskType.TESTING:
        return process.env.SOGNA_MODEL_AUDITOR || 'qwen2.5-coder:7b';
      case SognaTaskType.DOCUMENTATION:
      case SognaTaskType.ARCHITECTURE:
        return process.env.SOGNA_MODEL_PHILOSOPHER || 'gemma2:9b';
      default:
        return process.env.SOGNA_MODEL_GUARD || 'llama3.1:latest';
    }
  }

  /**
   * Helper para detectar el tipo de tarea basado en palabras clave
   */
  public static detectTaskType(objective: string): SognaTaskType {
    const obj = objective.toLowerCase();
    if (obj.includes('test') || obj.includes('fix') || obj.includes('debug')) return SognaTaskType.DEBUGGING;
    if (obj.includes('refactor') || obj.includes('build') || obj.includes('implement')) return SognaTaskType.CODING;
    if (obj.includes('document') || obj.includes('readme') || obj.includes('explain')) return SognaTaskType.DOCUMENTATION;
    if (obj.includes('security') || obj.includes('audit') || obj.includes('protect')) return SognaTaskType.SECURITY;
    return SognaTaskType.SYSTEM;
  }
}
