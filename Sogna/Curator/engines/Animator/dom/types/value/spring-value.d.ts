import { SognaflowValue } from ".";
import { AnyResolvedKeyframe, SpringOptions } from "../animation/types";
/**
 * Create a `SognaflowValue` that animates to its latest value using a spring.
 * Can either be a value or track another `SognaflowValue`.
 *
 * ```jsx
 * const x = SognaflowValue(0)
 * const y = SpringValue(x, { stiffness: 300 })
 * ```
 *
 * @param source - Initial value or SognaflowValue to track
 * @param options - Spring configuration options
 * @returns `SognaflowValue`
 *
 * @public
 */
export declare function SpringValue<T extends AnyResolvedKeyframe>(source: T | SognaflowValue<T>, options?: SpringOptions): SognaflowValue<T>;
/**
 * Attach a spring animation to a SognaflowValue that will animate whenever the value changes.
 *
 * @param value - The SognaflowValue to animate
 * @param source - Initial value or SognaflowValue to track
 * @param options - Spring configuration options
 * @returns Cleanup function
 *
 * @public
 */
export declare function AttachSpring<T extends AnyResolvedKeyframe>(value: SognaflowValue<T>, source: T | SognaflowValue<T>, options?: SpringOptions): VoidFunction;
