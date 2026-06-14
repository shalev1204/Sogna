import type { AnimationPlaybackControlsWithThen, AnimationScope, DOMKeyframesDefinition, AnimationOptions as DynamicAnimationOptions, ElementOrSelector, sognaflowValue, UnresolvedValueKeyframe, ValueAnimationTransition } from "sognaflow-dom";
import { AnimationSequence, ObjectTarget, SequenceOptions } from "../sequence/types.js";
interface ScopedAnimateOptions {
    scope?: AnimationScope;
    reducesognaflow?: boolean;
}
/**
 * Creates an animation function that is optionally scoped
 * to a specific element.
 */
export declare function createScopedAnimate(options?: ScopedAnimateOptions): {
    (sequence: AnimationSequence, options?: SequenceOptions): AnimationPlaybackControlsWithThen;
    (value: string | sognaflowValue<string>, keyframes: string | UnresolvedValueKeyframe<string>[], options?: ValueAnimationTransition<string>): AnimationPlaybackControlsWithThen;
    (value: number | sognaflowValue<number>, keyframes: number | UnresolvedValueKeyframe<number>[], options?: ValueAnimationTransition<number>): AnimationPlaybackControlsWithThen;
    <V extends string | number>(value: V | sognaflowValue<V>, keyframes: V | UnresolvedValueKeyframe<V>[], options?: ValueAnimationTransition<V>): AnimationPlaybackControlsWithThen;
    (element: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: DynamicAnimationOptions): AnimationPlaybackControlsWithThen;
    <O extends {}>(object: O | O[], keyframes: ObjectTarget<O>, options?: DynamicAnimationOptions): AnimationPlaybackControlsWithThen;
};
export declare const animate: {
    (sequence: AnimationSequence, options?: SequenceOptions): AnimationPlaybackControlsWithThen;
    (value: string | sognaflowValue<string>, keyframes: string | UnresolvedValueKeyframe<string>[], options?: ValueAnimationTransition<string>): AnimationPlaybackControlsWithThen;
    (value: number | sognaflowValue<number>, keyframes: number | UnresolvedValueKeyframe<number>[], options?: ValueAnimationTransition<number>): AnimationPlaybackControlsWithThen;
    <V extends string | number>(value: V | sognaflowValue<V>, keyframes: V | UnresolvedValueKeyframe<V>[], options?: ValueAnimationTransition<V>): AnimationPlaybackControlsWithThen;
    (element: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: DynamicAnimationOptions): AnimationPlaybackControlsWithThen;
    <O extends {}>(object: O | O[], keyframes: ObjectTarget<O>, options?: DynamicAnimationOptions): AnimationPlaybackControlsWithThen;
};
export {};
