import fs from 'fs';
import path from 'path';
import { FinanceHub } from './financehub.js';

export interface Invoice {
    number: string;
    client_id: string;
    items: { description: string; amount: number }[];
    total: number;
    status: 'pending' | 'paid' | 'cancelled';
    created_at: string;
}

export class BillingEngine {
    private static INVOICE_DIR = path.join(process.cwd(), '.sognatore', 'business', 'billing');

    static async createInvoice(clientId: string, items: { description: string; amount: number }[]): Promise<Invoice> {
        const total = items.reduce((acc, item) => acc + item.amount, 0);
        const invoice: Invoice = {
            number: `INV-${Date.now()}`,
            client_id: clientId,
            items,
            total,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        this.saveInvoice(invoice);
        
        // Notify FinanceHub
        FinanceHub.getInstance().recordExpense(0, `Invoice Issued: ${invoice.number}`);
        
        return invoice;
    }

    static async generateMarkdown(invoice: Invoice): Promise<string> {
        return `
# INVOICE: ${invoice.number}
**Client ID**: ${invoice.client_id}
**Date**: ${invoice.created_at}

| Description | Amount |
| :--- | :---: |
${invoice.items.map(i => `| ${i.description} | ${i.amount} |`).join('\n')}
| **TOTAL** | **${invoice.total}** |

**Status**: ${invoice.status.toUpperCase()}
`;
    }

    private static saveInvoice(invoice: Invoice) {
        if (!fs.existsSync(this.INVOICE_DIR)) fs.mkdirSync(this.INVOICE_DIR, { recursive: true });
        fs.writeFileSync(path.join(this.INVOICE_DIR, `${invoice.number}.json`), JSON.stringify(invoice, null, 2));
    }
}
