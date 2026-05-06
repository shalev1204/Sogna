import { AnimationOptions, DOMKeyframesDefinition } from "../animation/types.js";
export type ViewTransitionAnimationDefinition = {
    keyframes: DOMKeyframesDefinition;
    options: AnimationOptions;
};
export type ViewTransitionTarget = {
    layout?: ViewTransitionAnimationDefinition;
    enter?: ViewTransitionAnimationDefinition;
    exit?: ViewTransitionAnimationDefinition;
    new?: ViewTransitionAnimationDefinition;
    old?: ViewTransitionAnimationDefinition;
};
export type ViewTransitionOptions = AnimationOptions & {
    interrupt?: "wait" | "immediate";
};
export type ViewTransitionTargetDefinition = string | Element;
