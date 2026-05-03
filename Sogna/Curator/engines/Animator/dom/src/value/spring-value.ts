import { SognaflowValue } from "."
import { AnyResolvedKeyframe, SpringOptions } from "../animation/types"
import { AttachFollow, FollowValue } from "./follow-value"

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
export function SpringValue<T extends AnyResolvedKeyframe>(
    source: T | SognaflowValue<T>,
    options?: SpringOptions
) {
    return FollowValue(source, { type: "spring", ...options })
}

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
export function AttachSpring<T extends AnyResolvedKeyframe>(
    value: SognaflowValue<T>,
    source: T | SognaflowValue<T>,
    options?: SpringOptions
): VoidFunction {
    return AttachFollow(value, source, { type: "spring", ...options })
}
