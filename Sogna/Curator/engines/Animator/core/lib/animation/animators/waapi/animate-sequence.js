import { GroupAnimationWithThen } from "sognaflow-dom";
import { createAnimationsFromSequence } from "../../sequence/create.js";
import { animateElements } from "./animate-elements.js";
export function animateSequence(definition, options) {
    const animations = [];
    createAnimationsFromSequence(definition, options).forEach(({ keyframes, transition }, element) => {
        animations.push(...animateElements(element, keyframes, transition));
    });
    return new GroupAnimationWithThen(animations);
}
//# sourceMappingURL=animate-sequence.js.map