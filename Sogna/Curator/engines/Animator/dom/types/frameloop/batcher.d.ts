import { Batcher, FrameData, Process, Steps } from "./types";
export declare function CreateRenderBatcher(scheduleNextBatch: (callback: Function) => void, allowKeepAlive: boolean): {
    schedule: Batcher;
    cancel: (process: Process) => void;
    state: FrameData;
    steps: Steps;
};
