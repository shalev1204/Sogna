import fs from 'fs';
import path from 'path';

export interface Lead {
    id: string;
    name: string;
    email: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won';
    value?: number;
}

export class SalesHub {
    private static STORAGE_DIR = path.join(process.cwd(), '.sognatore', 'business', 'sales');

    static async addLead(lead: Omit<Lead, 'id'>): Promise<Lead> {
        const id = `lead_${Date.now()}`;
        const newLead: Lead = { id, ...lead };
        
        this.saveLead(newLead);
        return newLead;
    }

    static async getLeads(): Promise<Lead[]> {
        if (!fs.existsSync(this.STORAGE_DIR)) return [];
        return fs.readdirSync(this.STORAGE_DIR)
            .map(f => JSON.parse(fs.readFileSync(path.join(this.STORAGE_DIR, f), 'utf8')));
    }

    private static saveLead(lead: Lead) {
        if (!fs.existsSync(this.STORAGE_DIR)) fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
        fs.writeFileSync(path.join(this.STORAGE_DIR, `${lead.id}.json`), JSON.stringify(lead, null, 2));
    }

    static async updateStatus(id: string, status: Lead['status']) {
        const leads = await this.getLeads();
        const lead = leads.find(l => l.id === id);
        if (lead) {
            lead.status = status;
            this.saveLead(lead);
        }
    }
}
