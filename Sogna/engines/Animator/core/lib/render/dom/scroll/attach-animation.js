import { observeTimeline } from "sognaflow-dom";
import { canUseNativeTimeline } from "./utils/can-use-timeline.js";
import { getTimeline } from "./utils/get-timeline.js";
import { offsetToViewTimelineRange } from "./utils/offset-to-range.js";
export function attachToAnimation(animation, options) {
    const timeline = getTimeline(options);
    const range = options.target
        ? offsetToViewTimelineRange(options.offset)
        : undefined;
    /**
     * Use native timeline when:
     * - No target: ScrollTimeline (existing behaviour)
* - Target with mappable offset: ViewTimeline with named range
     * - Target with unmappable offset: fall back to JS observe
     */
    const useNative = options.target
        ? canUseNativeTimeline(options.target) && !!range
        : canUseNativeTimeline();
    return animation.attachTimeline({
        timeline: useNative ? timeline : undefined,
        ...(range &&
            useNative && {
            rangeStart: range.rangeStart,
            rangeEnd: range.rangeEnd,
        }),
        observe: (valueAnimation) => {
            valueAnimation.pause();
            return observeTimeline((progress) => {
                valueAnimation.time =
                    valueAnimation.iterationDuration * progress;
            }, timeline);
        },
    });
}
//# sourceMappingURL=attach-animation.js.map