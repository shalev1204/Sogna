import { EventEmitter } from 'events';
import * as path from 'path';
import { FS as fs } from '../utils/fs.js';
import { createHash } from 'crypto';

export enum SognaEventType {
  THOUGHT = 'processor.thought',
  ACTION_START = 'processor.action.start',
  ACTION_END = 'processor.action.end',
  OBSERVATION = 'processor.observation',
  COMPLETION = 'processor.completion',
  SUMMARY = 'processor.summary',
  ERROR = 'processor.error',
  SUSPENSION = 'processor.suspension',
  RECOVERY = 'system.recovery',
  LOG = 'system.log'
}

export enum FailureClass {
  COMPILE = 'COMPILE',
  TEST = 'TEST',
  INFRA = 'INFRA',
  PERMISSION = 'PERMISSION',
  GIT = 'GIT',
  SANDBOX = 'SANDBOX',
  API = 'API',
  LSP = 'LSP',
  CREDENTIALS = 'CREDENTIALS',
  NONE = 'NONE'
}

export enum EventProvenance {
  LIVE = 'LIVE', // Real-time agent action
  TEST = 'TEST', // Synthetic/Validation tests
  HEALTH = 'HEALTH', // Proactive auto-healer check
  REPLAY = 'REPLAY' // Log re-injection
}

export interface SognaEvent {
  type: SognaEventType;
emitter: string; // The agent name or component
  swarm?: string;
  data: any;
  timestamp: string;
  sequenceId: number;
  provenance: EventProvenance;
  failureClass: FailureClass;
  fingerprint: string;
}

export class SognaEventBus extends EventEmitter {
  private static instance: SognaEventBus;
  private logPath: string;
  private sequenceCounter: number = 0;

  private constructor() {
    super();
    // In a monorepo, logs should likely stay in the sognatore workspace or a central one
    this.logPath = path.join(process.cwd(), '.sognatore', 'logs', 'processor_dump.jsonl');
    fs.ensureFileSync(this.logPath);
  }

  static getInstance(): SognaEventBus {
    if (!SognaEventBus.instance) {
      SognaEventBus.instance = new SognaEventBus();
    }
    return SognaEventBus.instance;
  }

  publish(event: Omit<SognaEvent, 'timestamp' | 'sequenceId' | 'fingerprint'> & { fingerprint?: string }) {
    const sequenceId = ++this.sequenceCounter;
    const timestamp = new Date().toISOString();
    
    const fingerprint = event.fingerprint || this.computeFingerprint(event);

    const fullEvent: SognaEvent = {
      ...event,
      timestamp,
      sequenceId,
      fingerprint
    };

    this.emit(fullEvent.type, fullEvent);
    this.emit('*', fullEvent); 

    this.persistEvent(fullEvent);
  }

  private computeFingerprint(event: any): string {
    const payload = JSON.stringify({
      type: event.type,
      emitter: event.emitter,
      failureClass: event.failureClass,
      data: event.data
    });
    return createHash('sha256').update(payload).digest('hex').substring(0, 12);
  }

  private persistEvent(event: SognaEvent) {
    try {
      fs.appendFileSync(this.logPath, JSON.stringify(event) + '\n');
    } catch (e) {
      // Avoid circular logging if persistence fails
    }
  }

  signalTaskEnd() {
    this.emit('system.task_end');
  }

  /**
   * Subscribe to all events (wildcard)
   */
  subscribe(callback: (event: SognaEvent) => void) {
    this.on('*', callback);
  }
}
