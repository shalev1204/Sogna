import fs from 'fs';
import path from 'path';

export interface MemoryFragment {
    id: string;
    department: string;
    topic: string;
    content: any;
    timestamp: string;
    confidence: number;
}

export class GlobalMemory {
    private static MEMORY_PATH = path.join(process.cwd(), '.sognatore', 'processor', 'global_memory.json');
    private static instance: GlobalMemory;

    private constructor() {
        this.ensureStorage();
    }

    static getInstance(): GlobalMemory {
        if (!this.instance) this.instance = new GlobalMemory();
        return this.instance;
    }

    private ensureStorage() {
        const dir = path.dirname(GlobalMemory.MEMORY_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(GlobalMemory.MEMORY_PATH)) {
            fs.writeFileSync(GlobalMemory.MEMORY_PATH, JSON.stringify([], null, 2));
        }
    }

    store(fragment: Omit<MemoryFragment, 'id' | 'timestamp'>) {
        const memory = this.load();
        const newFragment: MemoryFragment = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            ...fragment
        };
        memory.push(newFragment);
        fs.writeFileSync(GlobalMemory.MEMORY_PATH, JSON.stringify(memory, null, 2));
        console.log(`[GlobalMemory] Stored fragment from ${fragment.department}: ${fragment.topic}`);
    }

    load(): MemoryFragment[] {
        const data = fs.readFileSync(GlobalMemory.MEMORY_PATH, 'utf8');
        return JSON.parse(data);
    }

    recall(query: { department?: string, topic?: string }): MemoryFragment[] {
        let memory = this.load();
        if (query.department) memory = memory.filter(m => m.department === query.department);
        if (query.topic) memory = memory.filter(m => m.topic.includes(query.topic!));
        return memory;
    }
}
