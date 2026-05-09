/**
 * Registro de Skills para el Departamento de Legal
 * Enfoque en control jurídica, protección de IP y cumplimiento normativo.
 */
export const LegalSkillRegistry = {
    COMPLIANCE: [
        'gdpr-data-handling',
        'aws-compliance-checker',
        'pci-compliance',
        'security-predatore'
    ],
    IP_PROTECTION: [
        'nft-standards',
        'solidity-security',
        'security-scanning-security-hardening'
    ],
    CONTRACTS: [
        'lex',
        'employment-contract-templates',
        'legal-advisor'
    ],
    ETHICS: [
        'azure-ai-contentsafety-ts',
        'satori',
        'ui-a11y'
    ]
};

export type LegalSkillCategory = keyof typeof LegalSkillRegistry;
