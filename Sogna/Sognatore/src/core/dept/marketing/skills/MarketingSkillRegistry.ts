/**
 * Registro Global de Skills para el Departamento de Marketing
 * Mapea las capacidades técnicas del Vault (+1000 skills) a los agentes del Agentes.
 */
export const MarketingSkillRegistry = {
 BRANDING: [
 'brand-guidelines-anthropic',
 'visual-emotion-engineer',
 'design-spells',
 'brand-perception-psychologist'
 ],
 SEO_GROWTH: [
 'seo-audit',
 'seo-aeo-blog-writer',
 'seo-aeo-keyword-research',
 'growth-engine',
 'programmatic-seo'
 ],
 COPYWRITING: [
 'copywriting-psychologist',
 'ux-copy',
 'headline-psychologist',
 'subject-line-psychologist'
 ],
 STRATEGY: [
 'content-marketer',
 'market-sizing-analysis',
 'competitor-alternatives',
 'customer-psychographic-profiler'
 ],
 CHANNELS: [
 'instagram-automation',
 'linkedin-automation',
 'twitter-automation',
 'slack-automation'
 ]
};

export type MarketingSkillCategory = keyof typeof MarketingSkillRegistry;
