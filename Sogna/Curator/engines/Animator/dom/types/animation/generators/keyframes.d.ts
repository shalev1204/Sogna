import { EasingFunction } from "sognaflow-utils";
import { AnyResolvedKeyframe, KeyframeGenerator, ValueAnimationOptions } from "../types";
export declare function defaultEasing(values: any[], easing?: EasingFunction): EasingFunction[];
export declare function keyframes<T extends AnyResolvedKeyframe>({ duration, keyframes: keyframeValues, times, ease, }: ValueAnimationOptions<T>): KeyframeGenerator<T>;
