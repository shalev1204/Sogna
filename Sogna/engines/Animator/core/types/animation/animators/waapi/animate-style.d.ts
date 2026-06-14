import { AnimationPlaybackControlsWithThen, AnimationScope, DOMKeyframesDefinition, AnimationOptions as DynamicAnimationOptions, ElementOrSelector } from "sognaflow-dom";
export declare const createScopedWaapiAnimate: (scope?: AnimationScope) => (elementOrSelector: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: DynamicAnimationOptions) => AnimationPlaybackControlsWithThen;
export declare const animateMini: (elementOrSelector: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: DynamicAnimationOptions) => AnimationPlaybackControlsWithThen;
