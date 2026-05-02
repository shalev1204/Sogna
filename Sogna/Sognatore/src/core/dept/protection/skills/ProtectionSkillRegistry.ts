/**
 * Registro de Skills para el Departamento de Protection
 * Enfoque en ciberdefensa, hardening y respuesta ante incidentes.
 */
export const ProtectionSkillRegistry = {
    DEFENSE: [
        'aws-security-audit',
        'aws-iam-best-practices',
        'security-scanning-security-hardening',
        'mtls-configuration'
    ],
    THREAT_HUNTING: [
        'ffuf-web-fuzzing',
        'sqlmap-database-pentesting',
        'red-team-tactics',
        'vulnerability-scanner'
    ],
    PRIVACY: [
        'secrets-management',
        'aws-secrets-rotation',
        'gdpr-data-handling',
        'constant-time-analysis'
    ],
    INCIDENT_RESPONSE: [
        'incident-response-smart-fix',
        'incident-runbook-templates',
        'distributed-debugging-debug-trace'
    ]
};

export type ProtectionSkillCategory = keyof typeof ProtectionSkillRegistry;
