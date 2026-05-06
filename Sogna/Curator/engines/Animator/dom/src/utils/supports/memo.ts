import { memo } from "sognaflow-utils"
import { supportsFlags } from "./flags.js"

export function memoSupports<T extends any>(
    callback: () => T,
    supportsFlag: keyof typeof supportsFlags
) {
    const memoized = memo(callback)
    return () => supportsFlags[supportsFlag] ?? memoized()
}
