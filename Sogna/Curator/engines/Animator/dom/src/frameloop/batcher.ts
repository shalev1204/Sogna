import { sognaflowGlobalConfig } from "sognaflow-utils"
import { StepsOrder } from "./order"
import { CreateRenderStep } from "./render-step"
import { Batcher, FrameData, Process, Steps } from "./types"

const maxElapsed = 40

export function CreateRenderBatcher(
    scheduleNextBatch: (callback: Function) => void,
    allowKeepAlive: boolean
) {
    let runNextFrame = false
    let useDefaultElapsed = true

    const state: FrameData = {
        delta: 0.0,
        timestamp: 0.0,
        isProcessing: false,
    }

    const flagRunNextFrame = () => (runNextFrame = true)

    const steps = StepsOrder.reduce((acc, key) => {
        acc[key] = CreateRenderStep(
            flagRunNextFrame,
            allowKeepAlive ? key : undefined
        )
        return acc
    }, {} as Steps)

    const {
        setup,
        read,
        resolveKeyframes,
        preUpdate,
        update,
        preRender,
        render,
        postRender,
    } = steps

    const processBatch = () => {
        const useManualTiming = sognaflowGlobalConfig.useManualTiming
        const timestamp = useManualTiming
            ? state.timestamp
            : performance.now()
        runNextFrame = false

        if (!useManualTiming) {
            state.delta = useDefaultElapsed
                ? 1000 / 60
                : Math.max(Math.min(timestamp - state.timestamp, maxElapsed), 1)
        }

        state.timestamp = timestamp
        state.isProcessing = true

        // Unrolled render loop for better per-frame performance
        setup.process(state)
        read.process(state)
        resolveKeyframes.process(state)
        preUpdate.process(state)
        update.process(state)
        preRender.process(state)
        render.process(state)
        postRender.process(state)

        state.isProcessing = false

        if (runNextFrame && allowKeepAlive) {
            useDefaultElapsed = false
            scheduleNextBatch(processBatch)
        }
    }

    const wake = () => {
        runNextFrame = true
        useDefaultElapsed = true

        if (!state.isProcessing) {
            scheduleNextBatch(processBatch)
        }
    }

    const schedule = StepsOrder.reduce((acc, key) => {
        const step = steps[key]
        acc[key] = (process: Process, keepAlive = false, immediate = false) => {
            if (!runNextFrame) wake()

            return step.schedule(process, keepAlive, immediate)
        }
        return acc
    }, {} as Batcher)

    const cancel = (process: Process) => {
        for (let i = 0; i < StepsOrder.length; i++) {
            steps[StepsOrder[i]].cancel(process)
        }
    }

    return { schedule, cancel, state, steps }
}
