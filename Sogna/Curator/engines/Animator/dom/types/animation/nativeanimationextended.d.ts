import { NativeAnimation, NativeAnimationOptions } from "./NativeAnimation.js";
import { AnyResolvedKeyframe, ValueAnimationOptions } from "./types.js";
export type NativeAnimationOptionsExtended<T extends AnyResolvedKeyframe> = NativeAnimationOptions & ValueAnimationOptions<T> & NativeAnimationOptions;
export declare class NativeAnimationExtended<T extends AnyResolvedKeyframe> extends NativeAnimation<T> {
    options: NativeAnimationOptionsExtended<T>;
    constructor(options: NativeAnimationOptionsExtended<T>);
    /**
     * WAAPI doesn't natively have any interruption capabilities.
     *
     * Rather than read committed styles back out of the DOM, we can
     * create a renderless JS animation and sample it twice to calculate
     * its current value, "previous" value, and therefore allow
     * sognaflow to calculate velocity for any subsequent animation.
     */
    updateSognaflowValue(value?: T): void;
}
