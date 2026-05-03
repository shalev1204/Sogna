import { supportsScrollTimeline, supportsViewTimeline } from "sognaflow-dom"

export function canUseNativeTimeline(target?: Element) {
    if (typeof window === "undefined") return false
    return target ? supportsViewTimeline() : supportsScrollTimeline()
}
