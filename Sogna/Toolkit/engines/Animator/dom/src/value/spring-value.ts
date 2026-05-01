import { sognaflowValue } from "."
import { AnyResolvedKeyframe, SpringOptions } from "../animation/types"
import { attachFollow, followValue } from "./follow-value"

/**
 * Create a `sognaflowValue` that animates to its latest value using a spring.
 * Can either be a value or track another `sognaflowValue`.
 *
 * ```jsx
 * const x = sognaflowValue(0)
 * const y = springValue(x, { stiffness: 300 })
 * ```
 *
 * @param source - Initial value or sognaflowValue to track
 * @param options - Spring configuration options
 * @returns `sognaflowValue`
 *
 * @public
 */
export function springValue<T extends AnyResolvedKeyframe>(
    source: T | sognaflowValue<T>,
    options?: SpringOptions
) {
    return followValue(source, { type: "spring", ...options })
}

/**
 * Attach a spring animation to a sognaflowValue that will animate whenever the value changes.
 *
 * @param value - The sognaflowValue to animate
 * @param source - Initial value or sognaflowValue to track
 * @param options - Spring configuration options
 * @returns Cleanup function
 *
 * @public
 */
export function attachSpring<T extends AnyResolvedKeyframe>(
    value: sognaflowValue<T>,
    source: T | sognaflowValue<T>,
    options?: SpringOptions
): VoidFunction {
    return attachFollow(value, source, { type: "spring", ...options })
}
