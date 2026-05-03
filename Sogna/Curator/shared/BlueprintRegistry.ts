import path from 'path';

export interface RequiredNode {
  path: string;
  type: 'file' | 'directory';
  description: string;
}

export interface BlueprintVetoRule {
  id: string;
  pattern: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProjectBlueprint {
  id: string;
  name: string;
  description: string;
  requiredNodes: RequiredNode[];
  vetoRules: BlueprintVetoRule[];
}

export const BLUEPRINT_REGISTRY: Record<string, ProjectBlueprint> = {
  'sognatore-core': {
    id: 'sognatore-core',
    name: 'Sognatore Core Engine',
    description: 'Institutional standard for the Sognatore agentic core.',
    requiredNodes: [
      { path: 'src/core/agents/Agent.ts', type: 'file', description: 'Core Agent RARV loop' },
      { path: 'src/core/Orchestrator.ts', type: 'file', description: 'Heuristic Router & Compactor' },
      { path: 'src/core/Doctor.ts', type: 'file', description: 'System health diagnostic' },
      { path: 'src/core/BootstrapEngine.ts', type: 'file', description: 'Professional startup lifecycle' },
      { path: 'resources/config/agents.md', type: 'file', description: 'Agent role registry' }
    ],
    vetoRules: [
      { 
        id: 'no-direct-eval', 
        pattern: 'eval\\(', 
        message: 'Direct eval() usage is strictly forbidden in Sognatore core.', 
        severity: 'error' 
      }
    ]
  },
  'sogna-unicorn': {
    id: 'sogna-unicorn',
    name: 'Sogna Unicorn (Fullstack)',
    description: 'High-performance standard for Next.js/TypeScript unicorn projects.',
    requiredNodes: [
      { path: 'src/app', type: 'directory', description: 'Next.js App Router root' },
      { path: 'prisma/schema.prisma', type: 'file', description: 'Database schema definition' },
      { path: 'README.md', type: 'file', description: 'Project documentation' },
      { path: '.env.example', type: 'file', description: 'Environment variables template' }
    ],
    vetoRules: [
      { 
        id: 'no-secret-pushed', 
        pattern: 'AI_API_KEY=sk-', 
        message: 'Potential secret leak detected in code.', 
        severity: 'error' 
      }
    ]
  },
  'toolkit-core': {
    id: 'toolkit-core',
    name: 'Sogna Toolkit Shared',
    description: 'Standards for shared utilities and institutional engines.',
    requiredNodes: [
      { path: 'shared/AuditVault.ts', type: 'file', description: 'Institutional telemetry vault' },
      { path: 'shared/AutoHealer.ts', type: 'file', description: 'Self-healing engine' }
    ],
    vetoRules: []
  }
};

export function getBlueprint(id: string): ProjectBlueprint | undefined {
  return BLUEPRINT_REGISTRY[id];
}
