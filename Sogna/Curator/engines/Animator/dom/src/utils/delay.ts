import { CancelFrame, Frame } from "../frameloop"
import { Time } from "../frameloop/sync-time"
import type { FrameData } from "../frameloop/types"
import { secondsToMilliseconds } from "sognaflow-utils"

export type DelayedFunction = (overshoot: number) => void

/**
 * Timeout defined in ms
 */
export function Delay(callback: DelayedFunction, timeout: number) {
    const start = Time.now()

    const checkElapsed = ({ timestamp }: FrameData) => {
        const elapsed = timestamp - start

        if (elapsed >= timeout) {
            CancelFrame(checkElapsed)
            callback(elapsed - timeout)
        }
    }

    Frame.setup(checkElapsed, true)

    return () => CancelFrame(checkElapsed)
}

export function DelayInSeconds(callback: DelayedFunction, timeout: number) {
    return Delay(callback, secondsToMilliseconds(timeout))
}
