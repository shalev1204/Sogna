import type {
    AnimationPlaybackControlsWithThen,
    AnimationScope,
    DOMKeyframesDefinition,
    AnimationOptions as DynamicAnimationOptions,
    ElementOrSelector,
    sognaflowValue,
    UnresolvedValueKeyframe,
    ValueAnimationTransition,
} from "sognaflow-dom"
import { GroupAnimationWithThen } from "sognaflow-dom"
import { removeItem } from "sognaflow-utils"
import {
    AnimationSequence,
    ObjectTarget,
    SequenceOptions,
} from "../sequence/types.js"
import { animateSequence } from "./sequence.js"
import { animateSubject } from "./subject.js"

function isSequence(value: unknown): value is AnimationSequence {
    return Array.isArray(value) && value.some(Array.isArray)
}

interface ScopedAnimateOptions {
    scope?: AnimationScope
    reducesognaflow?: boolean
}

/**
 * Creates an animation function that is optionally scoped
 * to a specific element.
 */
export function createScopedAnimate(options: ScopedAnimateOptions = {}) {
    const { scope, reducesognaflow } = options
    /**
     * Animate a sequence
     */
    function scopedAnimate(
        sequence: AnimationSequence,
        options?: SequenceOptions
    ): AnimationPlaybackControlsWithThen
    /**
     * Animate a string
     */
    function scopedAnimate(
        value: string | sognaflowValue<string>,
        keyframes: string | UnresolvedValueKeyframe<string>[],
        options?: ValueAnimationTransition<string>
    ): AnimationPlaybackControlsWithThen
    /**
     * Animate a number
     */
    function scopedAnimate(
        value: number | sognaflowValue<number>,
        keyframes: number | UnresolvedValueKeyframe<number>[],
        options?: ValueAnimationTransition<number>
    ): AnimationPlaybackControlsWithThen
    /**
     * Animate a generic sognaflow value
     */
    function scopedAnimate<V extends string | number>(
        value: V | sognaflowValue<V>,
        keyframes: V | UnresolvedValueKeyframe<V>[],
        options?: ValueAnimationTransition<V>
    ): AnimationPlaybackControlsWithThen
    /**
     * Animate an Element
     */
    function scopedAnimate(
        element: ElementOrSelector,
        keyframes: DOMKeyframesDefinition,
        options?: DynamicAnimationOptions
    ): AnimationPlaybackControlsWithThen
    /**
     * Animate an object
     */
    function scopedAnimate<O extends {}>(
        object: O | O[],
        keyframes: ObjectTarget<O>,
        options?: DynamicAnimationOptions
    ): AnimationPlaybackControlsWithThen
    /**
     * Implementation
     */
    function scopedAnimate<O extends {}>(
        subjectOrSequence:
            | AnimationSequence
            | sognaflowValue<number>
            | sognaflowValue<string>
            | number
            | string
            | ElementOrSelector
            | O
            | O[],
        optionsOrKeyframes?:
            | SequenceOptions
            | number
            | string
            | UnresolvedValueKeyframe<number>[]
            | UnresolvedValueKeyframe<string>[]
            | DOMKeyframesDefinition
            | ObjectTarget<O>,
        options?:
            | ValueAnimationTransition<number>
            | ValueAnimationTransition<string>
            | DynamicAnimationOptions
    ): AnimationPlaybackControlsWithThen {
        let animations: AnimationPlaybackControlsWithThen[] = []
        let animationOnComplete: VoidFunction | undefined

        if (isSequence(subjectOrSequence)) {
            const { onComplete, ...sequenceOptions } =
                (optionsOrKeyframes as SequenceOptions) || {}
            if (typeof onComplete === "function") {
                animationOnComplete = onComplete as VoidFunction
            }
            animations = animateSequence(
                subjectOrSequence,
                reducesognaflow !== undefined
                    ? { reducesognaflow, ...sequenceOptions }
                    : (sequenceOptions as SequenceOptions),
                scope
            )
        } else {
            // Extract top-level onComplete so it doesn't get applied per-value
            const { onComplete, ...rest } = options || {}
            if (typeof onComplete === "function") {
                animationOnComplete = onComplete as VoidFunction
            }
            animations = animateSubject(
                subjectOrSequence as ElementOrSelector,
                optionsOrKeyframes as DOMKeyframesDefinition,
                (reducesognaflow !== undefined
                    ? { reducesognaflow, ...rest }
                    : rest) as DynamicAnimationOptions,
                scope
            )
        }

        const animation = new GroupAnimationWithThen(animations)

        if (animationOnComplete) {
            animation.finished.then(animationOnComplete)
        }

        if (scope) {
            scope.animations.push(animation)
            animation.finished.then(() => {
                removeItem(scope.animations, animation)
            })
        }

        return animation
    }

    return scopedAnimate
}

export const animate = createScopedAnimate()
