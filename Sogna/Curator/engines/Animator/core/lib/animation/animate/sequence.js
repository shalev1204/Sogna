import { sognaflowValue, spring, } from "sognaflow-dom";
import { createAnimationsFromSequence } from "../sequence/create.js";
import { animateSubject } from "./subject.js";
export function animateSequence(sequence, options, scope) {
    const animations = [];
    /**
     * Pre-process: replace function segments with sognaflowValue segments,
     * subscribe callbacks immediately
     */
    const processedSequence = sequence.map((segment) => {
        if (Array.isArray(segment) && typeof segment[0] === "function") {
            const callback = segment[0];
            const mv = sognaflowValue(0);
            mv.on("change", callback);
            if (segment.length === 1) {
                return [mv, [0, 1]];
            }
            else if (segment.length === 2) {
                return [mv, [0, 1], segment[1]];
            }
            else {
                return [mv, segment[1], segment[2]];
            }
        }
        return segment;
    });
    const animationDefinitions = createAnimationsFromSequence(processedSequence, options, scope, { spring });
    animationDefinitions.forEach(({ keyframes, transition }, subject) => {
        animations.push(...animateSubject(subject, keyframes, transition));
    });
    return animations;
}
//# sourceMappingURL=sequence.js.map