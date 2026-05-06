import { AnimationPlaybackControls, GroupAnimationWithThen } from "sognaflow-dom"
import { createAnimationsFromSequence } from "../../sequence/create.js"
import { AnimationSequence, SequenceOptions } from "../../sequence/types.js"
import { animateElements } from "./animate-elements.js"

export function animateSequence(
    definition: AnimationSequence,
    options?: SequenceOptions
) {
    const animations: AnimationPlaybackControls[] = []

    createAnimationsFromSequence(definition, options).forEach(
        ({ keyframes, transition }, element: Element) => {
            animations.push(...animateElements(element, keyframes, transition))
        }
    )

    return new GroupAnimationWithThen(animations)
}
