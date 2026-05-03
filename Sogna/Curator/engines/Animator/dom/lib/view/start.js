import { secondsToMilliseconds } from "sognaflow-utils";
import { GroupAnimation } from "../animation/groupanimation";
import { NativeAnimation } from "../animation/nativeanimation";
import { NativeAnimationWrapper } from "../animation/nativeanimationwrapper";
import { GetValueTransition } from "../animation/utils/get-value-transition";
import { mapEasingToNativeEasing } from "../animation/waapi/easing/map-easing";
import { applyGeneratorOptions } from "../animation/waapi/utils/apply-generator";
import { ChooseLayerType } from "./utils/choose-layer-type";
import { ViewCSS } from "./utils/css";
import { GetViewAnimationLayerInfo } from "./utils/get-layer-info";
import { GetViewAnimations } from "./utils/get-view-animations";
import { HasTarget } from "./utils/has-target";
const definitionNames = ["layout", "enter", "exit", "new", "old"];
export function StartViewAnimation(builder) {
    const { update, targets, options: defaultOptions } = builder;
    if (!document.startViewTransition) {
        return new Promise(async (resolve) => {
            await update();
            resolve(new GroupAnimation([]));
        });
    }
    // TODO: Go over existing targets and ensure they all have ids
    /**
     * If we don't have any animations defined for the root target,
     * remove it from being captured.
     */
    if (!HasTarget("root", targets)) {
        ViewCSS.set(":root", {
            "view-transition-name": "none",
        });
    }
    /**
     * Set the timing curve to linear for all view transition layers.
     * This gets baked into the keyframes, which can't be changed
     * without breaking the generated animation.
     *
     * This allows us to set easing via updateTiming - which can be changed.
     */
    ViewCSS.set("::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*)", { "animation-timing-function": "linear !important" });
    ViewCSS.commit(); // Write
    const transition = document.startViewTransition(async () => {
        await update();
        // TODO: Go over new targets and ensure they all have ids
    });
    transition.finished.finally(() => {
        ViewCSS.remove(); // Write
    });
    return new Promise((resolve) => {
        transition.ready.then(() => {
            const generatedViewAnimations = GetViewAnimations();
            const animations = [];
            /**
             * Create animations for each of our explicitly-defined subjects.
             */
            targets.forEach((definition, target) => {
                // TODO: If target is not "root", resolve elements
                // and iterate over each
                for (const key of definitionNames) {
                    if (!definition[key])
                        continue;
                    const { keyframes, options } = definition[key];
                    for (let [valueName, valueKeyframes] of Object.entries(keyframes)) {
                        if (!valueKeyframes)
                            continue;
                        const valueOptions = {
                            ...GetValueTransition(defaultOptions, valueName),
                            ...GetValueTransition(options, valueName),
                        };
                        const type = ChooseLayerType(key);
                        /**
                         * If this is an opacity animation, and keyframes are not an array,
                         * we need to convert them into an array and set an initial value.
                         */
                        if (valueName === "opacity" &&
                            !Array.isArray(valueKeyframes)) {
                            const initialValue = type === "new" ? 0 : 1;
                            valueKeyframes = [initialValue, valueKeyframes];
                        }
                        /**
                         * Resolve stagger function if provided.
                         */
                        if (typeof valueOptions.delay === "function") {
                            valueOptions.delay = valueOptions.delay(0, 1);
                        }
                        valueOptions.duration && (valueOptions.duration = secondsToMilliseconds(valueOptions.duration));
                        valueOptions.delay && (valueOptions.delay = secondsToMilliseconds(valueOptions.delay));
                        const animation = new NativeAnimation({
                            ...valueOptions,
                            element: document.documentElement,
                            name: valueName,
                            pseudoElement: `::view-transition-${type}(${target})`,
                            keyframes: valueKeyframes,
                        });
                        animations.push(animation);
                    }
                }
            });
            /**
             * Handle browser generated animations
             */
            for (const animation of generatedViewAnimations) {
                if (animation.playState === "finished")
                    continue;
                const { effect } = animation;
                if (!effect || !(effect instanceof KeyframeEffect))
                    continue;
                const { pseudoElement } = effect;
                if (!pseudoElement)
                    continue;
                const name = GetViewAnimationLayerInfo(pseudoElement);
                if (!name)
                    continue;
                const targetDefinition = targets.get(name.layer);
                if (!targetDefinition) {
                    /**
                     * If transition name is group then update the timing of the animation
                     * whereas if it's old or new then we could possibly replace it using
                     * the above method.
                     */
                    const transitionName = name.type === "group" ? "layout" : "";
                    let animationTransition = {
                        ...GetValueTransition(defaultOptions, transitionName),
                    };
                    animationTransition.duration && (animationTransition.duration = secondsToMilliseconds(animationTransition.duration));
                    animationTransition =
                        applyGeneratorOptions(animationTransition);
                    const easing = mapEasingToNativeEasing(animationTransition.ease, animationTransition.duration);
                    effect.updateTiming({
                        delay: secondsToMilliseconds(animationTransition.delay ?? 0),
                        duration: animationTransition.duration,
                        easing,
                    });
                    animations.push(new NativeAnimationWrapper(animation));
                }
                else if (hasOpacity(targetDefinition, "enter") &&
                    hasOpacity(targetDefinition, "exit") &&
                    effect
                        .getKeyframes()
                        .some((keyframe) => keyframe.mixBlendMode)) {
                    animations.push(new NativeAnimationWrapper(animation));
                }
                else {
                    animation.cancel();
                }
            }
            resolve(new GroupAnimation(animations));
        });
    });
}
function hasOpacity(target, key) {
    return target?.[key]?.keyframes.opacity;
}
//# sourceMappingURL=start.js.map