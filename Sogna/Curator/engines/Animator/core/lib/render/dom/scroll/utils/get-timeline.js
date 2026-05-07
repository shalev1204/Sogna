import { scrollInfo } from "../track.js";
import { canUseNativeTimeline } from "./can-use-native-timeline.js";
import { offsetToViewTimelineRange } from "./offset-to-range.js";
const timelineCache = new Map();
function scrollTimelineFallback(options) {
    const currentTime = { value: 0 };
    const cancel = scrollInfo((info) => {
        currentTime.value = info[options.axis].progress * 100;
    }, options);
    return { currentTime, cancel };
}
export function getTimeline({ source, container, ...options }) {
    const { axis } = options;
    if (source)
        container = source;
    let containerCache = timelineCache.get(container);
    if (!containerCache) {
        containerCache = new Map();
        timelineCache.set(container, containerCache);
    }
    const targetKey = options.target ?? "self";
    let targetCache = containerCache.get(targetKey);
    if (!targetCache) {
        targetCache = {};
        containerCache.set(targetKey, targetCache);
    }
    const axisKey = axis + (options.offset ?? []).join(",");
    if (!targetCache[axisKey]) {
        if (options.target && canUseNativeTimeline(options.target)) {
            const range = offsetToViewTimelineRange(options.offset);
            if (range) {
                targetCache[axisKey] = new ViewTimeline({
                    subject: options.target,
                    axis,
                });
            }
            else {
                targetCache[axisKey] = scrollTimelineFallback({
                    container,
                    ...options,
                });
            }
        }
        else if (canUseNativeTimeline()) {
            targetCache[axisKey] = new ScrollTimeline({
                source: container,
                axis,
            });
        }
        else {
            targetCache[axisKey] = scrollTimelineFallback({
                container,
                ...options,
            });
        }
    }
    return targetCache[axisKey];
}
//# sourceMappingURL=get-timeline.js.map