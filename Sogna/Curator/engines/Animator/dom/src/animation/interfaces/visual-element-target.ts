import { Frame } from "../../frameloop"
import { GetValueTransition } from "../utils/get-value-transition.js"
import { ResolveTransition } from "../utils/resolve-transition.js"
import { PositionalKeys } from "../../render/utils/keys-position.js"
import { setTarget } from "../../render/utils/setters.js"
import { AddValueToWillChange } from "../../value/will-change/add-will-change.js"
import { GetOptimisedAppearId } from "../optimized-appear/get-appear-id.js"
import { AnimateSognaflowValue } from "./sognaflow-value.js"
import type { VisualElementAnimationOptions } from "./types.js"
import type { AnimationPlaybackControlsWithThen } from "../types.js"
import type { TargetAndTransition } from "../../node/types.js"
import type { AnimationTypeState } from "../../render/utils/animation-state.js"
import type { VisualElement } from "../../render/VisualElement.js"

/**
 * Decide whether we should block this animation. Previously, we achieved this
 * just by checking whether the key was listed in protectedKeys, but this
 * posed problems if an animation was triggered by afterChildren and protectedKeys
 * had been set to true in the meantime.
 */
function shouldBlockAnimation(
    { protectedKeys, needsAnimating }: AnimationTypeState,
    key: string
) {
    const shouldBlock =
        protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true

    needsAnimating[key] = false
    return shouldBlock
}

export function AnimateTarget(
    visualElement: VisualElement,
    targetAndTransition: TargetAndTransition,
    { delay = 0, transitionOverride, type }: VisualElementAnimationOptions = {}
): AnimationPlaybackControlsWithThen[] {
    let {
        transition,
        transitionEnd,
        ...target
    } = targetAndTransition

    const defaultTransition = visualElement.getDefaultTransition()
    transition = transition
        ? ResolveTransition(transition, defaultTransition)
        : defaultTransition

    const reduceSognaflow = (transition as { reduceSognaflow?: boolean })?.reduceSognaflow

    if (transitionOverride) transition = transitionOverride

    const animations: AnimationPlaybackControlsWithThen[] = []

    const animationTypeState =
        type &&
        visualElement.animationState &&
        visualElement.animationState.getState()[type]

    for (const key in target) {
        const value = visualElement.getValue(
            key,
            visualElement.latestValues[key] ?? null
        )
        const valueTarget = target[key as keyof typeof target]

        if (
            valueTarget === undefined ||
            (animationTypeState &&
                shouldBlockAnimation(animationTypeState, key))
        ) {
            continue
        }

        const valueTransition = {
            delay,
            ...GetValueTransition(transition || {}, key),
        }

        /**
         * If the value is already at the defined target, skip the animation.
         * We still re-assert the value via Frame.update to take precedence
         * over any stale transitionEnd callbacks from previous animations.
         */
        const currentValue = value.get()
        if (
            currentValue !== undefined &&
            !value.isAnimating() &&
            !Array.isArray(valueTarget) &&
            valueTarget === currentValue &&
            !valueTransition.velocity
        ) {
            Frame.update(() => value.set(valueTarget as any))
            continue
        }

        /**
         * If this is the first time a value is being animated, check
         * to see if we're handling off from an existing animation.
         */
        let isHandoff = false
        if (window.sognaflowHandoffAnimation) {
            const appearId = GetOptimisedAppearId(visualElement)

            if (appearId) {
                const startTime = window.sognaflowHandoffAnimation(
                    appearId,
                    key,
                    Frame
                )

                if (startTime !== null) {
                    valueTransition.startTime = startTime
                    isHandoff = true
                }
            }
        }

        AddValueToWillChange(visualElement, key)

        const shouldReduceSognaflow =
            reduceSognaflow ?? visualElement.shouldReduceSognaflow

        value.start(
            AnimateSognaflowValue(
                key,
                value,
                valueTarget,
                shouldReduceSognaflow && PositionalKeys.has(key)
                    ? { type: false }
                    : valueTransition,
                visualElement,
                isHandoff
            )
        )

        const animation = value.animation

        if (animation) {
            animations.push(animation)
        }
    }

    if (transitionEnd) {
        const applyTransitionEnd = () =>
            Frame.update(() => {
                transitionEnd && setTarget(visualElement, transitionEnd)
            })

        if (animations.length) {
            Promise.all(animations).then(applyTransitionEnd)
        } else {
            applyTransitionEnd()
        }
    }

    return animations
}
