import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs-extra';
import { createHash } from 'crypto';
export var SognaEventType;
(function (SognaEventType) {
    SognaEventType["THOUGHT"] = "brain.thought";
    SognaEventType["ACTION_START"] = "brain.action.start";
    SognaEventType["ACTION_END"] = "brain.action.end";
    SognaEventType["OBSERVATION"] = "brain.observation";
    SognaEventType["COMPLETION"] = "brain.completion";
    SognaEventType["SUMMARY"] = "brain.summary";
    SognaEventType["ERROR"] = "brain.error";
    SognaEventType["SUSPENSION"] = "brain.suspension";
    SognaEventType["RECOVERY"] = "system.recovery";
    SognaEventType["LOG"] = "system.log";
})(SognaEventType || (SognaEventType = {}));
export var FailureClass;
(function (FailureClass) {
    FailureClass["COMPILE"] = "COMPILE";
    FailureClass["TEST"] = "TEST";
    FailureClass["INFRA"] = "INFRA";
    FailureClass["PERMISSION"] = "PERMISSION";
    FailureClass["GIT"] = "GIT";
    FailureClass["SANDBOX"] = "SANDBOX";
    FailureClass["API"] = "API";
    FailureClass["LSP"] = "LSP";
    FailureClass["CREDENTIALS"] = "CREDENTIALS";
    FailureClass["NONE"] = "NONE";
})(FailureClass || (FailureClass = {}));
export var EventProvenance;
(function (EventProvenance) {
    EventProvenance["LIVE"] = "LIVE";
    EventProvenance["TEST"] = "TEST";
    EventProvenance["HEALTH"] = "HEALTH";
    EventProvenance["REPLAY"] = "REPLAY"; // Log re-injection
})(EventProvenance || (EventProvenance = {}));
export class SognaEventBus extends EventEmitter {
    static instance;
    logPath;
    sequenceCounter = 0;
    constructor() {
        super();
        // In a monorepo, logs should likely stay in the sognatore workspace or a central one
        this.logPath = path.join(process.cwd(), '.sognatore', 'logs', 'brain_dump.jsonl');
        fs.ensureFileSync(this.logPath);
    }
    static getInstance() {
        if (!SognaEventBus.instance) {
            SognaEventBus.instance = new SognaEventBus();
        }
        return SognaEventBus.instance;
    }
    publish(event) {
        const sequenceId = ++this.sequenceCounter;
        const timestamp = new Date().toISOString();
        const fingerprint = event.fingerprint || this.computeFingerprint(event);
        const fullEvent = {
            ...event,
            timestamp,
            sequenceId,
            fingerprint
        };
        this.emit(fullEvent.type, fullEvent);
        this.emit('*', fullEvent);
        this.persistEvent(fullEvent);
    }
    computeFingerprint(event) {
        const payload = JSON.stringify({
            type: event.type,
            emitter: event.emitter,
            failureClass: event.failureClass,
            data: event.data
        });
        return createHash('sha256').update(payload).digest('hex').substring(0, 12);
    }
    persistEvent(event) {
        try {
            fs.appendFileSync(this.logPath, JSON.stringify(event) + '\n');
        }
        catch (e) {
            // Avoid circular logging if persistence fails
        }
    }
    signalTaskEnd() {
        this.emit('system.task_end');
    }
}
