import { GroupAnimationWithThen } from "sognaflow-dom";
import { removeItem } from "sognaflow-utils";
import { animateSequence } from "./sequence.js";
import { animateSubject } from "./subject.js";
function isSequence(value) {
    return Array.isArray(value) && value.some(Array.isArray);
}
/**
 * Creates an animation function that is optionally scoped
 * to a specific element.
 */
export function createScopedAnimate(options = {}) {
    const { scope, reducesognaflow } = options;
    /**
     * Implementation
     */
    function scopedAnimate(subjectOrSequence, optionsOrKeyframes, options) {
        let animations = [];
        let animationOnComplete;
        if (isSequence(subjectOrSequence)) {
            const { onComplete, ...sequenceOptions } = optionsOrKeyframes || {};
            if (typeof onComplete === "function") {
                animationOnComplete = onComplete;
            }
            animations = animateSequence(subjectOrSequence, reducesognaflow !== undefined
                ? { reducesognaflow, ...sequenceOptions }
                : sequenceOptions, scope);
        }
        else {
            // Extract top-level onComplete so it doesn't get applied per-value
            const { onComplete, ...rest } = options || {};
            if (typeof onComplete === "function") {
                animationOnComplete = onComplete;
            }
            animations = animateSubject(subjectOrSequence, optionsOrKeyframes, (reducesognaflow !== undefined
                ? { reducesognaflow, ...rest }
                : rest), scope);
        }
        const animation = new GroupAnimationWithThen(animations);
        if (animationOnComplete) {
            animation.finished.then(animationOnComplete);
        }
        if (scope) {
            scope.animations.push(animation);
            animation.finished.then(() => {
                removeItem(scope.animations, animation);
            });
        }
        return animation;
    }
    return scopedAnimate;
}
export const animate = createScopedAnimate();
//# sourceMappingURL=index.js.map
