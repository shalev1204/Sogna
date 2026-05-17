import fs from 'fs';
import path from 'path';
import { EventBus } from './EventBus';

export interface MemoryFragment {
    id: string;
    department: string;
    topic: string;
    content: any;
    timestamp: string;
    confidence: number;
    tags?: string[];
}

/**
 * Sogna Global Memory Store
 *
 * Centralized JSON-based memory for cross-department knowledge fragments.
 * Integrated with the EventBus for institutional event emission on every
 * store/recall operation, enabling full observability.
 */
export class GlobalMemory {
    private static MEMORY_PATH = path.resolve(__dirname, '..', '..', '..', '.sognatore', 'processor', 'global_memory.json');
    private static instance: GlobalMemory;
    private eventBus: EventBus;

    private constructor() {
        this.ensureStorage();
        this.eventBus = EventBus.getInstance();
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

    /**
     * Store a new memory fragment and emit a CloudEvent.
     */
    store(fragment: Omit<MemoryFragment, 'id' | 'timestamp'>) {
        const memory = this.load();
        const newFragment: MemoryFragment = {
            id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            timestamp: new Date().toISOString(),
            ...fragment
        };
        memory.push(newFragment);

        // Enforce max capacity (1000 fragments)
        if (memory.length > 1000) {
            memory.splice(0, memory.length - 1000);
        }

        fs.writeFileSync(GlobalMemory.MEMORY_PATH, JSON.stringify(memory, null, 2));
        console.log(`[GlobalMemory] Stored fragment from ${fragment.department}: ${fragment.topic}`);

        // Emit event to institutional bus
        this.eventBus.emit(
            'memory.fragment_stored',
            `/core/brain/GlobalMemory`,
            `Fragment stored: ${fragment.department}/${fragment.topic} (confidence: ${fragment.confidence})`,
            'info',
            {
                fragmentId: newFragment.id,
                department: fragment.department,
                topic: fragment.topic,
                confidence: fragment.confidence
            }
        );

        return newFragment;
    }

    /**
     * Load all memory fragments from persistent storage.
     */
    load(): MemoryFragment[] {
        try {
            const data = fs.readFileSync(GlobalMemory.MEMORY_PATH, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }

    /**
     * Recall fragments matching department, topic, and/or minimum confidence.
     */
    recall(query: { department?: string; topic?: string; minConfidence?: number; limit?: number }): MemoryFragment[] {
        let memory = this.load();

        if (query.department) {
            memory = memory.filter(m => m.department === query.department);
        }
        if (query.topic) {
            memory = memory.filter(m => m.topic.toLowerCase().includes(query.topic!.toLowerCase()));
        }
        if (query.minConfidence !== undefined) {
            memory = memory.filter(m => m.confidence >= query.minConfidence!);
        }

        // Sort by confidence descending, then by timestamp descending
        memory.sort((a, b) => {
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        const limit = query.limit || 50;
        return memory.slice(0, limit);
    }

    /**
     * Get memory statistics for observability.
     */
    getStats(): { total: number; departments: Record<string, number>; avgConfidence: number } {
        const memory = this.load();
        const departments: Record<string, number> = {};
        let totalConfidence = 0;

        for (const frag of memory) {
            departments[frag.department] = (departments[frag.department] || 0) + 1;
            totalConfidence += frag.confidence;
        }

        return {
            total: memory.length,
            departments,
            avgConfidence: memory.length > 0 ? totalConfidence / memory.length : 0
        };
    }

    /**
     * Prune fragments below a confidence threshold.
     */
    prune(minConfidence: number): number {
        const memory = this.load();
        const before = memory.length;
        const filtered = memory.filter(m => m.confidence >= minConfidence);
        fs.writeFileSync(GlobalMemory.MEMORY_PATH, JSON.stringify(filtered, null, 2));

        const pruned = before - filtered.length;
        if (pruned > 0) {
            this.eventBus.emit(
                'memory.fragments_pruned',
                '/core/brain/GlobalMemory',
                `Pruned ${pruned} fragments below confidence ${minConfidence}`,
                'warning',
                { prunedCount: pruned, threshold: minConfidence }
            );
        }

        return pruned;
    }
}
