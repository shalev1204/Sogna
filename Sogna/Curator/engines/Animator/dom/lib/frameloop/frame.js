import { CreateRenderStep } from "./render-step.js";
export * from "./types.js";
export const FrameDataInstance = {
    delta: 0,
    timestamp: 0,
    isProcessing: false,
};
const stepsOrder = [
    "read",
    "resolveKeyframes",
    "update",
    "preRender",
    "render",
    "postRender",
];
export const Frame = /* @__PURE__ */ stepsOrder.reduce((acc, key) => {
    acc[key] = CreateRenderStep(() => Frame.process());
    return acc;
}, {});
const CancelFrame = (process) => {
    stepsOrder.forEach((key) => Frame[key].cancel(process));
};
export const frame = Frame;
export const frameData = FrameDataInstance;
export { CancelFrame, CancelFrame as cancelFrame };
export const FrameSteps = Frame;
//# sourceMappingURL=frame.js.map
