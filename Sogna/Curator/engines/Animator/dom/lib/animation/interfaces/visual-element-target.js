import { Frame as frame } from "../../frameloop";
import { GetValueTransition as getValueTransition } from "../utils/get-value-transition.js";
import { ResolveTransition as resolveTransition } from "../utils/resolve-transition.js";
import { PositionalKeys as positionalKeys } from "../../render/utils/keys-position.js";
import { setTarget } from "../../render/utils/setters.js";
import { AddValueToWillChange as addValueToWillChange } from "../../value/will-change/add-will-change.js";
import { GetOptimisedAppearId as getOptimisedAppearId } from "../optimized-appear/get-appear-id.js";
import { AnimateSognaflowValue as animateSognaflowValue } from "./sognaflow-value.js";
/**
 * Decide whether we should block this animation. Previously, we achieved this
 * just by checking whether the key was listed in protectedKeys, but this
 * posed problems if an animation was triggered by afterChildren and protectedKeys
 * had been set to true in the meantime.
 */
function shouldBlockAnimation({ protectedKeys, needsAnimating }, key) {
    const shouldBlock = protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true;
    needsAnimating[key] = false;
    return shouldBlock;
}
export function AnimateTarget(visualElement, targetAndTransition, { delay = 0, transitionOverride, type } = {}) {
    let { transition, transitionEnd, ...target } = targetAndTransition;
    const defaultTransition = visualElement.getDefaultTransition();
    transition = transition
        ? resolveTransition(transition, defaultTransition)
        : defaultTransition;
    const reduceSognaflow = transition?.reduceSognaflow;
    if (transitionOverride)
        transition = transitionOverride;
    const animations = [];
    const animationTypeState = type &&
        visualElement.animationState &&
        visualElement.animationState.getState()[type];
    for (const key in target) {
        const value = visualElement.getValue(key, visualElement.latestValues[key] ?? null);
        const valueTarget = target[key];
        if (valueTarget === undefined ||
            (animationTypeState &&
                shouldBlockAnimation(animationTypeState, key))) {
            continue;
        }
        const valueTransition = {
            delay,
            ...getValueTransition(transition || {}, key),
        };
        /**
         * If the value is already at the defined target, skip the animation.
         * We still re-assert the value via frame.update to take precedence
         * over any stale transitionEnd callbacks from previous animations.
         */
        const currentValue = value.get();
        if (currentValue !== undefined &&
            !value.isAnimating() &&
            !Array.isArray(valueTarget) &&
            valueTarget === currentValue &&
            !valueTransition.velocity) {
            frame.update(() => value.set(valueTarget));
            continue;
        }
        /**
         * If this is the first time a value is being animated, check
         * to see if we're handling off from an existing animation.
         */
        let isHandoff = false;
        if (window.sognaflowHandoffAnimation) {
            const appearId = getOptimisedAppearId(visualElement);
            if (appearId) {
                const startTime = window.sognaflowHandoffAnimation(appearId, key, frame);
                if (startTime !== null) {
                    valueTransition.startTime = startTime;
                    isHandoff = true;
                }
            }
        }
        addValueToWillChange(visualElement, key);
        const shouldReduceSognaflow = reduceSognaflow ?? visualElement.shouldReduceSognaflow;
        value.start(animateSognaflowValue(key, value, valueTarget, shouldReduceSognaflow && positionalKeys.has(key)
            ? { type: false }
            : valueTransition, visualElement, isHandoff));
        const animation = value.animation;
        if (animation) {
            animations.push(animation);
        }
    }
    if (transitionEnd) {
        const applyTransitionEnd = () => frame.update(() => {
            transitionEnd && setTarget(visualElement, transitionEnd);
        });
        if (animations.length) {
            Promise.all(animations).then(applyTransitionEnd);
        }
        else {
            applyTransitionEnd();
        }
    }
    return animations;
}
//# sourceMappingURL=visual-element-target.js.map