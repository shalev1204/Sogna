import { CreateRenderStep } from "./render-step.js"
import { FrameData, Process, StepId } from "./types.js"

export * from "./types.js"

export const FrameDataInstance: FrameData = {
    delta: 0,
    timestamp: 0,
    isProcessing: false,
}

const stepsOrder: StepId[] = [
    "read",
    "resolveKeyframes",
    "update",
    "preRender",
    "render",
    "postRender",
]

export const Frame = /* @__PURE__ */ stepsOrder.reduce((acc, key) => {
    acc[key] = CreateRenderStep(() => Frame.process())
    return acc
}, {} as any)

const CancelFrame = (process: Process) => {
    stepsOrder.forEach((key) => Frame[key].cancel(process))
}

export const frame = Frame

export const frameData = FrameDataInstance

export { CancelFrame, CancelFrame as cancelFrame }

export const FrameSteps = Frame
