/**
 * Registro de Skills para el Departamento de Operations
 * El motor central de la eficiencia y logística system de Sognatore.
 */
export const OperationsSkillRegistry = {
    WORKFLOW_MGMT: [
        'n8n-workflow-patterns',
        'trigger-dev',
        'inngest',
        'orchestrate-batch-refactor',
        'workflow-automation'
    ],
    RESOURCE_LOGISTICS: [
        'aws-cost-optimizer',
        'k8s-manifest-generator',
        'performance-profiling',
        'resource-management'
    ],
    AUTOMATION: [
        'github-actions-templates',
        'gitlab-ci-patterns',
        'bash-scripting',
        'powershell-windows'
    ],
    QUALITY_ASSURANCE: [
        'code-reviewer',
        'ui-review',
        'security-predatore',
        'performance-engineer',
        'quality-nonconformance'
    ],
    STRATEGIC_OPS: [
        'product-manager-toolkit',
        'business-analyst',
        'system-architecture'
    ]
};

export type OperationsSkillCategory = keyof typeof OperationsSkillRegistry;
