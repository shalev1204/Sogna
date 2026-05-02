/**
 * Registro Global de Skills para el Departamento de Growth
 * Enfocado en la expansión viral, retención y optimización de conversión.
 */
export const GrowthSkillRegistry = {
    HACKING: [
        'growth-engine',
        'viral-architect',
        'referral-program',
        'scarcity-urgency-psychologist'
    ],
    OPTIMIZATION: [
        'ab-test-setup',
        'page-cro',
        'form-cro',
        'signup-flow-cro'
    ],
    RETENTION: [
        'churn-prevention',
        'onboarding-psychologist',
        'customer-psychographic-profiler'
    ],
    DATA: [
        'mixpanel-automation',
        'amplitude-automation',
        'posthog-automation'
    ]
};

export type GrowthSkillCategory = keyof typeof GrowthSkillRegistry;
