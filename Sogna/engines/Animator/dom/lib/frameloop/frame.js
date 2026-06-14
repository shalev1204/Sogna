import { CreateRenderStep } from "./render-step.js";
import { StepsOrder } from "./order.js";
export * from "./types.js";
export const FrameDataInstance = {
    delta: 0,
    timestamp: 0,
    isProcessing: false,
};
let runNextFrame = false;
let useDefaultElapsed = true;
const steps = /* @__PURE__ */ StepsOrder.reduce((acc, key) => {
    acc[key] = CreateRenderStep(() => (runNextFrame = true), key);
    return acc;
}, {});
const processStep = (stepId) => steps[stepId].process(FrameDataInstance);
const scheduleNextBatch = typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : (callback) => queueMicrotask(callback);
const processFrame = (timestamp) => {
    runNextFrame = false;
    const now = timestamp ?? performance.now();
    FrameDataInstance.delta = useDefaultElapsed
        ? 1000 / 60
        : Math.max(Math.min(now - FrameDataInstance.timestamp, 40), 1);
    FrameDataInstance.timestamp = now;
    FrameDataInstance.isProcessing = true;
    StepsOrder.forEach(processStep);
    FrameDataInstance.isProcessing = false;
    if (runNextFrame) {
        useDefaultElapsed = false;
        scheduleNextBatch(processFrame);
    }
};
const wake = () => {
    runNextFrame = true;
    useDefaultElapsed = true;
    if (!FrameDataInstance.isProcessing) {
        scheduleNextBatch(processFrame);
    }
};
export const Frame = /* @__PURE__ */ StepsOrder.reduce((acc, key) => {
    const step = steps[key];
    const schedule = (process, keepAlive = false, immediate = false) => {
        if (!runNextFrame)
            wake();
        return step.schedule(process, keepAlive, immediate);
    };
    acc[key] = schedule;
    return acc;
}, {});
const CancelFrame = (process) => {
    StepsOrder.forEach((key) => steps[key].cancel(process));
};
export const frame = Frame;
export const frameData = FrameDataInstance;
export { CancelFrame, CancelFrame as cancelFrame };
export const FrameSteps = steps;
export const frameSteps = FrameSteps;
//# sourceMappingURL=frame.js.map