import fs from 'fs';
import path from 'path';

export interface InfraNode {
    id: string;
    type: 'GPU_NODE' | 'COMPUTE_NODE' | 'DATABASE' | 'API_ACCOUNT';
    provider: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
    specs: any;
    intelligence_level: number; // 1-10 (As requested by user)
}

export class InfrastructureInventory {
    private static INVENTORY_PATH = path.join(process.cwd(), '.sognatore', 'infrastructure', 'inventory.json');

    static registerNode(node: InfraNode) {
        const inventory = this.load();
        const index = inventory.findIndex(n => n.id === node.id);
        if (index !== -1) {
            inventory[index] = node;
        } else {
            inventory.push(node);
        }
        
        if (!fs.existsSync(path.dirname(this.INVENTORY_PATH))) {
            fs.mkdirSync(path.dirname(this.INVENTORY_PATH), { recursive: true });
        }
        
        fs.writeFileSync(this.INVENTORY_PATH, JSON.stringify(inventory, null, 2));
    }

    static load(): InfraNode[] {
        if (!fs.existsSync(this.INVENTORY_PATH)) return [];
        return JSON.parse(fs.readFileSync(this.INVENTORY_PATH, 'utf8'));
    }

    static getGlobalIntelligenceScore(): number {
        const nodes = this.load();
        if (nodes.length === 0) return 0;
        return nodes.reduce((acc, node) => acc + node.intelligence_level, 0) / nodes.length;
    }
}
