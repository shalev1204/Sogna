import { AnimationScope } from "sognaflow-dom";
export declare function useAnimate<T extends Element = any>(): [AnimationScope<T>, {
    (sequence: import("../sequence/types.js").AnimationSequence, options?: import("../sequence/types.js").SequenceOptions): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
    (value: string | import("sognaflow-dom").sognaflowValue<string>, keyframes: string | import("sognaflow-dom").UnresolvedValueKeyframe<string>[], options?: import("sognaflow-dom").ValueAnimationTransition<string>): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
    (value: number | import("sognaflow-dom").sognaflowValue<number>, keyframes: number | import("sognaflow-dom").UnresolvedValueKeyframe<number>[], options?: import("sognaflow-dom").ValueAnimationTransition<number>): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
    <V extends string | number>(value: V | import("sognaflow-dom").sognaflowValue<V>, keyframes: V | import("sognaflow-dom").UnresolvedValueKeyframe<V>[], options?: import("sognaflow-dom").ValueAnimationTransition<V>): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
    (element: import("sognaflow-dom").ElementOrSelector, keyframes: import("sognaflow-dom").DOMKeyframesDefinition, options?: import("sognaflow-dom").AnimationOptions): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
    <O extends {}>(object: O | O[], keyframes: import("../sequence/types.js").ObjectTarget<O>, options?: import("sognaflow-dom").AnimationOptions): import("sognaflow-dom").AnimationPlaybackControlsWithThen;
}];
