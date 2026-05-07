import { AnimationScope } from "sognaflow-dom";
export declare function useAnimateMini<T extends Element = any>(): [AnimationScope<T>, (elementOrSelector: import("sognaflow-dom").ElementOrSelector, keyframes: import("sognaflow-dom").DOMKeyframesDefinition, options?: import("sognaflow-dom").AnimationOptions) => import("sognaflow-dom").AnimationPlaybackControlsWithThen];
