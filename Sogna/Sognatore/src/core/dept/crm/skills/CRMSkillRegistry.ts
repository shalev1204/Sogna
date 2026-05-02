/**
 * Registro de Skills para el Departamento de CRM
 * Enfoque en la retención, soporte y éxito del cliente institucional.
 */
export const CRMSkillRegistry = {
    SUPPORT: [
        'zendesk-automation',
        'freshdesk-automation',
        'slack-automation',
        'intercom-automation'
    ],
    SUCCESS: [
        'onboarding-psychologist',
        'ux-feedback',
        'customer-support'
    ],
    LOYALTY: [
        'churn-prevention',
        'referral-program',
        'reward-system-design'
    ],
    DATA: [
        'customer-psychographic-profiler',
        'segment-cdp',
        'hubspot-automation'
    ]
};

export type CRMSkillCategory = keyof typeof CRMSkillRegistry;
