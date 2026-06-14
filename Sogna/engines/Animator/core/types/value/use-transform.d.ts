import { AnyResolvedKeyframe, sognaflowValue, TransformOptions } from "sognaflow-dom";
export type InputRange = number[];
type SingleTransformer<I, O> = (input: I) => O;
type MultiTransformer<I, O> = (input: I[]) => O;
/**
 * Create multiple `sognaflowValue`s that transform the output of another `sognaflowValue` by mapping it from one range of values into multiple output ranges.
 *
 * @remarks
 *
 * This is useful when you want to derive multiple values from a single input value.
 * The keys of the output map must remain constant across renders.
 *
 * ```jsx
 * export const MyComponent = () => {
 *   const x = usesognaflowValue(0)
 *   const { opacity, scale } = useTransform(x, [0, 100], {
 *     opacity: [0, 1],
 *     scale: [0.5, 1]
 *   })
 *
 *   return (
 *     <sognaflow.div style={{ opacity, scale, x }} />
 *   )
 * }
 * ```
 *
 * @param inputValue - `sognaflowValue`
 * @param inputRange - A linear series of numbers (either all increasing or decreasing)
 * @param outputMap - An object where keys map to output ranges. Each output range must be the same length as `inputRange`.
 * @param options - Transform options applied to all outputs
 *
 * @returns An object with the same keys as `outputMap`, where each value is a `sognaflowValue`
 *
 * @public
 */
export declare function useTransform<T extends Record<string, any[]>>(inputValue: sognaflowValue<number>, inputRange: InputRange, outputMap: T, options?: TransformOptions<T[keyof T][number]>): {
    [K in keyof T]: sognaflowValue<T[K][number]>;
};
/**
 * Create a `sognaflowValue` that transforms the output of another `sognaflowValue` by mapping it from one range of values into another.
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
 *
 * The input range must be a linear series of numbers. The output range
 * can be any value type supported by sognaflow: numbers, colors, shadows, etc.
 *
 * Every value in the output range must be of the same type and in the same format.
 *
 * ```jsx
 * export const MyComponent = () => {
 *   const x = usesognaflowValue(0)
 *   const xRange = [-200, -100, 100, 200]
 *   const opacityRange = [0, 1, 1, 0]
 *   const opacity = useTransform(x, xRange, opacityRange)
 *
 *   return (
 *     <sognaflow.div
 *       animate={{ x: 200 }}
 *       style={{ opacity, x }}
 *     />
 *   )
 * }
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
export declare function useTransform<I, O>(value: sognaflowValue<number>, inputRange: InputRange, outputRange: O[], options?: TransformOptions<O>): sognaflowValue<O>;
/**
 * Create a `sognaflowValue` that transforms the output of another `sognaflowValue` through a function.
 * In this example, `y` will always be double `x`.
 *
 * ```jsx
 * export const MyComponent = () => {
 *   const x = usesognaflowValue(10)
 *   const y = useTransform(x, value => value * 2)
 *
 *   return <sognaflow.div style={{ x, y }} />
 * }
 * ```
 *
 * @param input - A `sognaflowValue` that will pass its latest value through `transform` to update the returned `sognaflowValue`.
 * @param transform - A function that accepts the latest value from `input` and returns a new value.
 * @returns `sognaflowValue`
 *
 * @public
 */
export declare function useTransform<I, O>(input: sognaflowValue<I>, transformer: SingleTransformer<I, O>): sognaflowValue<O>;
/**
 * Pass an array of `sognaflowValue`s and a function to combine them. In this example, `z` will be the `x` multiplied by `y`.
 *
 * ```jsx
 * export const MyComponent = () => {
 *   const x = usesognaflowValue(0)
 *   const y = usesognaflowValue(0)
 *   const z = useTransform([x, y], ([latestX, latestY]) => latestX * latestY)
 *
 *   return <sognaflow.div style={{ x, y, z }} />
 * }
 * ```
 *
 * @param input - An array of `sognaflowValue`s that will pass their latest values through `transform` to update the returned `sognaflowValue`.
 * @param transform - A function that accepts the latest values from `input` and returns a new value.
 * @returns `sognaflowValue`
 *
 * @public
 */
export declare function useTransform<I, O>(input: sognaflowValue<string>[] | sognaflowValue<number>[] | sognaflowValue<AnyResolvedKeyframe>[], transformer: MultiTransformer<I, O>): sognaflowValue<O>;
export declare function useTransform<I, O>(transformer: () => O): sognaflowValue<O>;
export {};
