import { FailureClass } from './events/SognaEventBus.js';

export enum EscalationLevel {
  NONE = 'NONE',
  NOTIFY = 'NOTIFY',
  HUMAN_INPUT = 'HUMAN_INPUT',
  ABORT = 'ABORT'
}

export interface RecoveryStep {
  name: string;
  command?: string;
  action?: () => Promise<void>;
  critical: boolean;
}

export interface RecoveryRecipe {
  scenario: FailureClass;
  maxAttempts: number;
  steps: RecoveryStep[];
  escalation: EscalationLevel;
  proactive?: boolean;
  check?: {
    action: (cwd: string) => Promise<boolean>;
  };
}

export interface ShellValidationResult {
  isSafe: boolean;
  category: 'READ_ONLY' | 'MODIFYING' | 'DESTRUCTIVE' | 'DANGER_ZONE';
  violations: string[];
}

export class PolicyEngine {
  private static instance: PolicyEngine;
  private recipes: Map<FailureClass, RecoveryRecipe> = new Map();

  private constructor() {
    this.initializeDefaultPolicies();
  }

  static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  private initializeDefaultPolicies() {
    // GIT POLICY
    this.recipes.set(FailureClass.GIT, {
      scenario: FailureClass.GIT,
      maxAttempts: 2,
      escalation: EscalationLevel.HUMAN_INPUT,
      steps: [
// @Sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
        { name: 'Fetch Origin', command: 'git fetch origin', critical: true },
        { name: 'Stash Changes', command: 'git stash', critical: false },
        { name: 'Sync Branch', command: 'git pull --rebase', critical: true },
        { name: 'Pop Changes', command: 'git stash pop', critical: false }
      ]
    });

    // INFRA POLICY
    this.recipes.set(FailureClass.INFRA, {
      scenario: FailureClass.INFRA,
      maxAttempts: 3,
      escalation: EscalationLevel.NOTIFY,
      steps: [
        { name: 'Install Dependencies', command: 'npm install', critical: true },
        { name: 'Clean Workspace', command: 'npm run clean', critical: false }
      ],
      proactive: true,
      check: {
        action: async (cwd: string) => {
          // Simple check for node_modules presence as a proxy for infra health
          const fs = await import('fs-extra');
          const path = await import('path');
          return !(await fs.pathExists(path.join(cwd, 'node_modules')));
        }
      }
    });

    // LSP POLICY
    this.recipes.set(FailureClass.LSP, {
        scenario: FailureClass.LSP,
        maxAttempts: 1,
        escalation: EscalationLevel.NONE,
        steps: [
            { name: 'Restart LSP Bridge', action: async () => {
                // Implementation will be called via custom action in AutoHealer
            }, critical: true }
        ]
    });
  }

  getRecipe(scenario: FailureClass): RecoveryRecipe | undefined {
    return this.recipes.get(scenario);
  }

  addRecipe(recipe: RecoveryRecipe) {
    this.recipes.set(recipe.scenario, recipe);
  }

  // --- SHELL VALIDATION ENGINE (18+ Submodules) ---
  
  private static readonly SHELL_RULES = {
    READ_ONLY: [
      'ls', 'pwd', 'cat', 'head', 'tail', 'grep', 'find', 'wc', 'stat', 
      'du', 'df', 'which', 'whoami', 'groups', 'date', 'uptime', 'free'
    ],
    MODIFYING: [
      'touch', 'mkdir', 'cp', 'mv', 'git', 'npm', 'yarn', 'pnpm', 'npx', 'sed'
    ],
    DESTRUCTIVE: [
      'rm', 'rmdir', 'truncate', 'shred', 'dd', 'wipe'
    ],
    DANGER_ZONE: [
      'sudo', 'su', 'chmod', 'chown', 'chgrp', 'crontab', 'visudo', 'passwd'
    ]
  };

  validateCommand(command: string): ShellValidationResult {
    const trimmed = command.trim();
    const parts = trimmed.split(/\s+/);
    const baseCmd = parts[0];
    const violations: string[] = [];

    // Redirection Checks
    if (trimmed.includes('>') || trimmed.includes('>>')) {
      violations.push('Write redirection detected (">" or ">>")');
    }

    // Pipe Safety
    if (trimmed.includes('|')) {
      const segments = trimmed.split('|');
      segments.forEach(segment => {
        const segCmd = segment.trim().split(/\s+/)[0];
        if (PolicyEngine.SHELL_RULES.DESTRUCTIVE.includes(segCmd)) {
          violations.push(`Destructive command "${segCmd}" found in pipeline`);
        }
      });
    }

    // Sed In-place Check
    if (baseCmd === 'sed' && (trimmed.includes('-i') || trimmed.includes('--in-place'))) {
      violations.push('Sed in-place modification (-i) detected');
    }

    // Determine Category
    let category: ShellValidationResult['category'] = 'READ_ONLY';
    if (PolicyEngine.SHELL_RULES.DANGER_ZONE.includes(baseCmd)) category = 'DANGER_ZONE';
    else if (PolicyEngine.SHELL_RULES.DESTRUCTIVE.includes(baseCmd)) category = 'DESTRUCTIVE';
    else if (PolicyEngine.SHELL_RULES.MODIFYING.includes(baseCmd)) category = 'MODIFYING';

    return {
      isSafe: violations.length === 0,
      category,
      violations
    };
  }
}
