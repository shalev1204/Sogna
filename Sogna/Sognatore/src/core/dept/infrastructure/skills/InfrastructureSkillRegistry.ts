/**
 * Registro de Skills para el Departamento de Infrastructure
 * El cimiento físico y digital de la inteligencia independiente de Sognatore.
 */
export const InfrastructureSkillRegistry = {
    CLOUD_ORCHESTRATION: [
        'kubernetes-architect',
        'kubernetes-deployment',
        'docker-expert',
        'helm-chart-scaffolding',
        'gcp-cloud-run'
    ],
    DATA_PERSISTENCE: [
        'postgres-best-practices',
        'neon-postgres',
        'vector-database-engineer',
        'nosql-expert',
        'database-optimization'
    ],
    IAC_AUTOMATION: [
        'terraform-specialist',
        'terraform-module-library',
        'ansible-automation',
        'aws-serverless'
    ],
    SYSTEM_RELIABILITY: [
        'performance-engineer',
        'observability-monitoring-monitor-setup',
        'prometheus-configuration',
        'grafana-dashboards',
        'linux-troubleshooting'
    ],
    CONNECTIVITY: [
        'network-engineer',
        'istio-traffic-management',
        'service-mesh-expert',
        'mtls-configuration'
    ]
};

export type InfrastructureSkillCategory = keyof typeof InfrastructureSkillRegistry;
