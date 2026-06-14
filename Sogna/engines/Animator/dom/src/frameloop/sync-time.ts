import { sognaflowGlobalConfig } from "sognaflow-utils"
import { FrameDataInstance } from "./frame.js"

let now: number | undefined

function clearTime() {
    now = undefined
}

/**
 * An eventloop-synchronous alternative to performance.now().
 *
 * Ensures that time measurements remain consistent within a synchronous context.
 * Usually calling performance.now() twice within the same synchronous context
 * will return different values which isn't useful for animations when we're usually
 * trying to sync animations to the same frame.
 */
export const Time = {
    now: (): number => {
        if (now === undefined) {
            Time.set(
                FrameDataInstance.isProcessing || sognaflowGlobalConfig.useManualTiming
                    ? FrameDataInstance.timestamp
                    : performance.now()
            )
        }

        return now!
    },
    set: (newTime: number) => {
        now = newTime
        queueMicrotask(clearTime)
    },
}

export const time = Time

