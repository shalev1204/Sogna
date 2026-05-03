import { SognaflowValue, CollectSognaflowValues } from "."
import { SubscribeValue } from "./subscribe-value"

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
 * const x = CreateSognaflowValue(0)
 * const y = TransformValue(() => x.get() * 2) // double x
 * ```
 *
 * @param transformer - A transform function. This function must be pure with no side-effects or conditional statements.
 * @returns `sognaflowValue`
 *
 * @public
 */
export function TransformValue<O>(transform: () => O): SognaflowValue<O> {
    const collectedValues: SognaflowValue[] = []

    /**
     * Open session of collectsognaflowValues. Any sognaflowValue that calls get()
     * inside transform will be saved into this array.
     */
    CollectSognaflowValues.current = collectedValues
    const initialValue = transform()
    CollectSognaflowValues.current = undefined

    const value = CreateSognaflowValue(initialValue)

    SubscribeValue(collectedValues, value, transform)

    return value
}
