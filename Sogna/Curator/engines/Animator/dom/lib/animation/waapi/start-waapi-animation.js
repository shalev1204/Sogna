import { ActiveAnimations as activeAnimations } from "../../stats/animation-count.js";
import { StatsBuffer as statsBuffer } from "../../stats/buffer.js";
import { mapEasingToNativeEasing } from "./easing/map-easing.js";
export function StartWaapiAnimation(element, valueName, keyframes, { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease = "easeOut", times, } = {}, pseudoElement = undefined) {
    const keyframeOptions = {
        [valueName]: keyframes,
    };
    if (times)
        keyframeOptions.offset = times;
    const easing = mapEasingToNativeEasing(ease, duration);
    /**
     * If this is an easing array, apply to keyframes, not animation as a whole
     */
    if (Array.isArray(easing))
        keyframeOptions.easing = easing;
    if (statsBuffer.value) {
        activeAnimations.waapi++;
    }
    const options = {
        delay,
        duration,
        easing: !Array.isArray(easing) ? easing : "linear",
        fill: "both",
        iterations: repeat + 1,
        direction: repeatType === "reverse" ? "alternate" : "normal",
    };
    if (pseudoElement)
        options.pseudoElement = pseudoElement;
    const animation = element.animate(keyframeOptions, options);
    if (statsBuffer.value) {
        animation.finished.finally(() => {
            activeAnimations.waapi--;
        });
    }
    return animation;
}
//# sourceMappingURL=start-waapi-animation.js.map