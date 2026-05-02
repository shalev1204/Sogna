/**
 * Registro de Skills para el Departamento de Sales
 * Enfoque en prospección, negociación y cierre de contratos institucionales.
 */
export const SalesSkillRegistry = {
    PROSPECTING: [
        'apify-lead-generation',
        'linkedin-automation',
        'email-sequence',
        'cold-email'
    ],
    NEGOTIATION: [
        'objection-preemptor',
        'price-psychology-strategist',
        'trust-calibrator'
    ],
    CLOSING: [
        'salesforce-automation',
        'hubspot-automation',
        'payment-integration'
    ],
    CRM: [
        'clerk-auth',
        'brevo-automation',
        'customer-psychographic-profiler'
    ]
};

export type SalesSkillCategory = keyof typeof SalesSkillRegistry;
