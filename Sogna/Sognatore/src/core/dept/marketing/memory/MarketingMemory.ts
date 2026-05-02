import fs from 'fs';
import path from 'path';

export interface MarketingInsight {
    id: string;
    type: 'success' | 'failure' | 'trend';
    description: string;
    date: string;
}

export class MarketingMemory {
    private static MEMORY_PATH = path.join(process.cwd(), '.sognatore', 'business', 'marketing_memory.json');

    static saveInsight(insight: Omit<MarketingInsight, 'id' | 'date'>) {
        const memory = this.load();
        memory.push({
            id: `ins_${Date.now()}`,
            date: new Date().toISOString(),
            ...insight
        });
        
        if (!fs.existsSync(path.dirname(this.MEMORY_PATH))) {
            fs.mkdirSync(path.dirname(this.MEMORY_PATH), { recursive: true });
        }
        
        fs.writeFileSync(this.MEMORY_PATH, JSON.stringify(memory, null, 2));
    }

    static load(): MarketingInsight[] {
        if (!fs.existsSync(this.MEMORY_PATH)) return [];
        return JSON.parse(fs.readFileSync(this.MEMORY_PATH, 'utf8'));
    }

    static getLatestTrends(): string[] {
        return this.load()
            .filter(i => i.type === 'trend')
            .map(i => i.description);
    }
}
