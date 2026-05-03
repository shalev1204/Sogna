import type { AnimationPlaybackControlsWithThen, AnyResolvedKeyframe, UnresolvedValueKeyframe, ValueAnimationTransition } from "../types";
import { SognaflowValue } from "../../value";
export declare function AnimateSingleValue<V extends AnyResolvedKeyframe>(value: SognaflowValue<V> | V, keyframes: V | UnresolvedValueKeyframe<V>[], options?: ValueAnimationTransition): AnimationPlaybackControlsWithThen;
