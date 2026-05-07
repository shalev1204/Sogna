import { supportsScrollTimeline, supportsViewTimeline } from "sognaflow-dom";
export function canUseNativeTimeline(target) {
    if (typeof window === "undefined")
        return false;
    return target ? supportsViewTimeline() : supportsScrollTimeline();
}
//# sourceMappingURL=can-use-native-timeline.js.map