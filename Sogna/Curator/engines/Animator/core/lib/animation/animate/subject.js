import { animateTarget, issognaflowValue, visualElementStore, } from "sognaflow-dom";
import { invariant } from "sognaflow-utils";
import { createDOMVisualElement, createObjectVisualElement, } from "../utils/create-visual-element.js";
import { isDOMKeyframes } from "../utils/is-dom-keyframes.js";
import { resolveSubjects } from "./resolve-subjects.js";
import { animateSingleValue } from "sognaflow-dom";
function isSingleValue(subject, keyframes) {
    return (issognaflowValue(subject) ||
        typeof subject === "number" ||
        (typeof subject === "string" && !isDOMKeyframes(keyframes)));
}
/**
 * Implementation
 */
export function animateSubject(subject, keyframes, options, scope) {
    const animations = [];
    if (isSingleValue(subject, keyframes)) {
        animations.push(animateSingleValue(subject, isDOMKeyframes(keyframes)
            ? keyframes.default || keyframes
            : keyframes, options ? options.default || options : options));
    }
    else {
        // Gracefully handle null/undefined subjects (e.g., from querySelector returning null)
        if (subject == null) {
            return animations;
        }
        const subjects = resolveSubjects(subject, keyframes, scope);
        const numSubjects = subjects.length;
        invariant(Boolean(numSubjects), "No valid elements provided.", "no-valid-elements");
        for (let i = 0; i < numSubjects; i++) {
            const thisSubject = subjects[i];
            const createVisualElement = thisSubject instanceof Element
                ? createDOMVisualElement
                : createObjectVisualElement;
            if (!visualElementStore.has(thisSubject)) {
                createVisualElement(thisSubject);
            }
            const visualElement = visualElementStore.get(thisSubject);
            const transition = { ...options };
            /**
             * Resolve stagger function if provided.
             */
            if ("delay" in transition &&
                typeof transition.delay === "function") {
                transition.delay = transition.delay(i, numSubjects);
            }
            animations.push(...animateTarget(visualElement, { ...keyframes, transition }, {}));
        }
    }
    return animations;
}
//# sourceMappingURL=subject.js.map
