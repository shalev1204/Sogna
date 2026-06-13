import { observeTimeline } from "sognaflow-dom";
import { scrollInfo } from "./track.js";
import { getTimeline } from "./utils/get-timeline.js";
/**
 * If the onScroll function has two arguments, it's expecting
 * more specific information about the scroll from scrollInfo.
 */
function isOnScrollWithInfo(onScroll) {
    return onScroll.length === 2;
}
export function attachToFunction(onScroll, options) {
    if (isOnScrollWithInfo(onScroll)) {
        return scrollInfo((info) => {
            onScroll(info[options.axis].progress, info);
        }, options);
    }
    else {
        return observeTimeline(onScroll, getTimeline(options));
    }
}
//# sourceMappingURL=attach-function.js.map