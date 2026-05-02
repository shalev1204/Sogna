export interface BusinessStage {
    name: string;
    description: string;
    action: 'branding' | 'development' | 'finance' | 'marketing' | 'deployment';
    requires_approval: boolean;
}

export interface BusinessBlueprint {
    id: string;
    name: string;
    description: string;
    stages: BusinessStage[];
}

export class BusinessBlueprintRegistry {
    private static blueprints: Record<string, BusinessBlueprint> = {
        startup_mvp: {
            id: 'startup_mvp',
            name: 'Startup MVP Accelerator',
            description: 'Complete pipeline from idea to monetized product.',
            stages: [
                { name: 'Identity', description: 'Generate brand and playbooks', action: 'branding', requires_approval: true },
                { name: 'Core Dev', description: 'Scaffold application architecture', action: 'development', requires_approval: true },
                { name: 'Monetization', description: 'Configure payment gateways (Stripe)', action: 'finance', requires_approval: true },
                { name: 'Marketing', description: 'Generate launch assets and SEO', action: 'marketing', requires_approval: false },
                { name: 'Deployment', description: 'Deploy to production environment', action: 'deployment', requires_approval: true }
            ]
        },
        agency_fast_track: {
            id: 'agency_fast_track',
            name: 'AI Agency in a Box',
            description: 'Setup an autonomous content and lead generation agency.',
            stages: [
                { name: 'Niche Analysis', description: 'Identify target market', action: 'marketing', requires_approval: false },
                { name: 'System Setup', description: 'Initialize CRM and Slack', action: 'deployment', requires_approval: true },
                { name: 'Asset Engine', description: 'Configure Sognatore Studio for the niche', action: 'branding', requires_approval: true }
            ]
        }
    };

    static getBlueprint(id: string): BusinessBlueprint | undefined {
        return this.blueprints[id.toLowerCase()];
    }

    static listBlueprints(): string[] {
        return Object.keys(this.blueprints);
    }
}
