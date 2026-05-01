import { sognaflowValue, collectsognaflowValues, sognaflowValue } from "."
import { subscribeValue } from "./subscribe-value"

export type TransformInputRange = number[]
export type SingleTransformer<I, O> = (input: I) => O
export type MultiTransformer<I, O> = (input: I[]) => O
export type ValueTransformer<I, O> =
    | SingleTransformer<I, O>
    | MultiTransformer<I, O>

/**
 * Create a `sognaflowValue` that transforms the output of other `sognaflowValue`s by
 * passing their latest values through a transform function.
 *
 * Whenever a `sognaflowValue` referred to in the provided function is updated,
 * it will be re-evaluated.
 *
 * ```jsx
 * const x = sognaflowValue(0)
 * const y = transformValue(() => x.get() * 2) // double x
 * ```
 *
 * @param transformer - A transform function. This function must be pure with no side-effects or conditional statements.
 * @returns `sognaflowValue`
 *
 * @public
 */
export function transformValue<O>(transform: () => O): sognaflowValue<O> {
    const collectedValues: sognaflowValue[] = []

    /**
     * Open session of collectsognaflowValues. Any sognaflowValue that calls get()
     * inside transform will be saved into this array.
     */
    collectsognaflowValues.current = collectedValues
    const initialValue = transform()
    collectsognaflowValues.current = undefined

    const value = sognaflowValue(initialValue)

    subscribeValue(collectedValues, value, transform)

    return value
}
