import { CancelFrame, Frame } from "."
import { StepsOrder } from "./order"
import { Process } from "./types"

/**
 * @deprecated
 *
 * Import as `Frame` instead.
 */
export const Sync = Frame

/**
 * @deprecated
 *
 * Use CancelFrame(callback) instead.
 */
export const CancelSync = StepsOrder.reduce((acc, key) => {
    acc[key] = (process: Process) => CancelFrame(process)
    return acc
}, {} as Record<string, (process: Process) => void>)
