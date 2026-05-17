import fs from 'fs';
import path from 'path';

/**
 * CloudEvents 1.0 compliant event structure for the Sogna Institutional Bus.
 */
export interface SognaCloudEvent {
    specversion: '1.0';
    id: string;
    type: string;
    source: string;
    time: string;
    datacontenttype: 'application/json';
    data: {
        severity: 'info' | 'warning' | 'error' | 'critical';
        details: string;
        phase?: string;
        metadata?: Record<string, unknown>;
    };
}

interface EventBusStore {
    meta: {
        version: string;
        schema: string;
        description: string;
        max_events: number;
        created: string;
    };
    events: SognaCloudEvent[];
}

/**
 * Sogna Institutional Event Bus
 *
 * Manages structured event emission following CloudEvents 1.0 specification.
 * Events are persisted to the institutional bus file and can be queried
 * by type, source, severity, or time range.
 */
export class EventBus {
    private static readonly BUS_PATH = path.resolve(
        __dirname, '..', '..', '..', '..', 'memory', 'intelligence', 'events', 'bus.json'
    );
    private static readonly MAX_EVENTS = 200;
    private static instance: EventBus;

    private constructor() {
        this.ensureStore();
    }

    static getInstance(): EventBus {
        if (!this.instance) this.instance = new EventBus();
        return this.instance;
    }

    private ensureStore(): void {
        const dir = path.dirname(EventBus.BUS_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(EventBus.BUS_PATH)) {
            const initial: EventBusStore = {
                meta: {
                    version: '2.0.0',
                    schema: 'CloudEvents 1.0',
                    description: 'Sogna Institutional Event Bus',
                    max_events: EventBus.MAX_EVENTS,
                    created: new Date().toISOString()
                },
                events: []
            };
            fs.writeFileSync(EventBus.BUS_PATH, JSON.stringify(initial, null, 2));
        }
    }

    private loadStore(): EventBusStore {
        try {
            const raw = fs.readFileSync(EventBus.BUS_PATH, 'utf-8');
            return JSON.parse(raw);
        } catch {
            return {
                meta: {
                    version: '2.0.0',
                    schema: 'CloudEvents 1.0',
                    description: 'Sogna Institutional Event Bus',
                    max_events: EventBus.MAX_EVENTS,
                    created: new Date().toISOString()
                },
                events: []
            };
        }
    }

    /**
     * Emit a structured event to the institutional bus.
     */
    emit(
        type: string,
        source: string,
        details: string,
        severity: SognaCloudEvent['data']['severity'] = 'info',
        metadata?: Record<string, unknown>
    ): SognaCloudEvent {
        const store = this.loadStore();
        const now = new Date();

        const event: SognaCloudEvent = {
            specversion: '1.0',
            id: `evt_${now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 6)}`,
            type: `sogna.${type}`,
            source,
            time: now.toISOString(),
            datacontenttype: 'application/json',
            data: {
                severity,
                details,
                ...(metadata ? { metadata } : {})
            }
        };

        store.events.push(event);

        // Enforce max events cap
        if (store.events.length > EventBus.MAX_EVENTS) {
            store.events = store.events.slice(-EventBus.MAX_EVENTS);
        }

        fs.writeFileSync(EventBus.BUS_PATH, JSON.stringify(store, null, 2));
        return event;
    }

    /**
     * Query events by type prefix.
     */
    queryByType(typePrefix: string, limit = 20): SognaCloudEvent[] {
        const store = this.loadStore();
        return store.events
            .filter(e => e.type.startsWith(typePrefix))
            .slice(-limit);
    }

    /**
     * Query events by severity.
     */
    queryBySeverity(severity: SognaCloudEvent['data']['severity'], limit = 20): SognaCloudEvent[] {
        const store = this.loadStore();
        return store.events
            .filter(e => e.data.severity === severity)
            .slice(-limit);
    }

    /**
     * Get the most recent N events.
     */
    getRecent(count = 10): SognaCloudEvent[] {
        const store = this.loadStore();
        return store.events.slice(-count);
    }

    /**
     * Get total event count.
     */
    getCount(): number {
        const store = this.loadStore();
        return store.events.length;
    }
}
