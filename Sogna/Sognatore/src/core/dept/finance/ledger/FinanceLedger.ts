import fs from 'fs';
import path from 'path';

export interface Transaction {
    id: string;
    timestamp: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    currency: string;
    description: string;
    department: string;
}

export class FinanceLedger {
    private static LEDGER_PATH = path.join(process.cwd(), '.sognatore', 'finance', 'ledger.json');

    static recordTransaction(tx: Omit<Transaction, 'id' | 'timestamp'>) {
        const ledger = this.load();
        ledger.push({
            id: `tx_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...tx
        });
        
        if (!fs.existsSync(path.dirname(this.LEDGER_PATH))) {
            fs.mkdirSync(path.dirname(this.LEDGER_PATH), { recursive: true });
        }
        
        fs.writeFileSync(this.LEDGER_PATH, JSON.stringify(ledger, null, 2));
    }

    static load(): Transaction[] {
        if (!fs.existsSync(this.LEDGER_PATH)) return [];
        return JSON.parse(fs.readFileSync(this.LEDGER_PATH, 'utf8'));
    }

    static getBalance(): number {
        return this.load().reduce((acc, tx) => acc + (tx.type === 'INCOME' ? tx.amount : -tx.amount), 0);
    }
}
