import { AnimationPlaybackControlsWithThen, AnimationScope, DOMKeyframesDefinition, AnimationOptions as DynamicAnimationOptions, ElementOrSelector, sognaflowValue, UnresolvedValueKeyframe, ValueAnimationTransition } from "sognaflow-dom";
import { ObjectTarget } from "../sequence/types.js";
export type AnimationSubject = Element | sognaflowValue<any> | any;
/**
 * Animate a string
 */
export declare function animateSubject(value: string | sognaflowValue<string>, keyframes: string | UnresolvedValueKeyframe<string>[], options?: ValueAnimationTransition<string>): AnimationPlaybackControlsWithThen[];
/**
 * Animate a number
 */
export declare function animateSubject(value: number | sognaflowValue<number>, keyframes: number | UnresolvedValueKeyframe<number>[], options?: ValueAnimationTransition<number>): AnimationPlaybackControlsWithThen[];
/**
 * Animate a Element
 */
export declare function animateSubject(element: ElementOrSelector, keyframes: DOMKeyframesDefinition, options?: DynamicAnimationOptions, scope?: AnimationScope): AnimationPlaybackControlsWithThen[];
/**
 * Animate a object
 */
export declare function animateSubject<O extends Object>(object: O | O[], keyframes: ObjectTarget<O>, options?: DynamicAnimationOptions): AnimationPlaybackControlsWithThen[];
