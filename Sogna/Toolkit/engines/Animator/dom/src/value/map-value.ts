import { sognaflowValue } from "."
import { transform, TransformOptions } from "../utils/transform"
import { transformValue } from "./transform-value"

export type MapInputRange = number[]

/**
 * Create a `sognaflowValue` that maps the output of another `sognaflowValue` by
 * mapping it from one range of values into another.
 *
 * @remarks
 *
 * Given an input range of `[-200, -100, 100, 200]` and an output range of
 * `[0, 1, 1, 0]`, the returned `sognaflowValue` will:
 *
 * - When provided a value between `-200` and `-100`, will return a value between `0` and  `1`.
 * - When provided a value between `-100` and `100`, will return `1`.
 * - When provided a value between `100` and `200`, will return a value between `1` and  `0`
 *
 * The input range must be a linear series of numbers. The output range
 * can be any value type supported by sognaflow: numbers, colors, shadows, etc.
 *
 * Every value in the output range must be of the same type and in the same format.
 *
 * ```jsx
 * const x = sognaflowValue(0)
 * const xRange = [-200, -100, 100, 200]
 * const opacityRange = [0, 1, 1, 0]
 * const opacity = mapValue(x, xRange, opacityRange)
 * ```
 *
 * @param inputValue - `sognaflowValue`
 * @param inputRange - A linear series of numbers (either all increasing or decreasing)
 * @param outputRange - A series of numbers, colors or strings. Must be the same length as `inputRange`.
 * @param options -
 *
 *  - clamp: boolean. Clamp values to within the given range. Defaults to `true`
 *  - ease: EasingFunction[]. Easing functions to use on the interpolations between each value in the input and output ranges. If provided as an array, the array must be one item shorter than the input and output ranges, as the easings apply to the transition between each.
 *
 * @returns `sognaflowValue`
 *
 * @public
 */
export function mapValue<O>(
    inputValue: sognaflowValue<number>,
    inputRange: MapInputRange,
    outputRange: O[],
    options?: TransformOptions<O>
): sognaflowValue<O> {
    const map = transform(inputRange, outputRange, options)
    return transformValue(() => map(inputValue.get()))
}
