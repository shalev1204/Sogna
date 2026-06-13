import { GroupAnimationWithThen, } from "sognaflow-dom";
import { animateElements } from "./animate-elements.js";
export const createScopedWaapiAnimate = (scope) => {
    function scopedAnimate(elementOrSelector, keyframes, options) {
        return new GroupAnimationWithThen(animateElements(elementOrSelector, keyframes, options, scope));
    }
    return scopedAnimate;
};
export const animateMini = /*@__PURE__*/ createScopedWaapiAnimate();
//# sourceMappingURL=animate-style.js.map