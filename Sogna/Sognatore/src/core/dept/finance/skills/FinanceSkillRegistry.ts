/**
 * Registro de Skills para el Departamento de Finance
 * Enfoque en la gestión de capital, facturación y optimización de costes.
 */
export const FinanceSkillRegistry = {
    BILLING: [
        'stripe-automation',
        'paypal-integration',
        'billing-automation',
        'payment-integration'
    ],
    COST_MGMT: [
        'aws-cost-optimizer',
        'aws-cost-cleanup',
        'cost-optimization'
    ],
    AUDIT: [
        'aws-compliance-checker',
        'audit-skills',
        'pci-compliance'
    ],
    PLANNING: [
        'startup-financial-modeling',
        'risk-metrics-calculation',
        'market-sizing-analysis'
    ]
};

export type FinanceSkillCategory = keyof typeof FinanceSkillRegistry;
