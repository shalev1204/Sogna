import { SognaflowValue } from "../../value"
import { SognaflowValueState } from "../sognaflowvaluestate.js"

export function createEffect<Subject extends object>(
    addValue: (
        subject: Subject,
        state: SognaflowValueState,
        key: string,
        value: SognaflowValue
    ) => VoidFunction
) {
    const stateCache = new WeakMap<Subject, SognaflowValueState>()

    return (
        subject: Subject,
        values: Record<string, SognaflowValue>
    ): VoidFunction => {
        const state = stateCache.get(subject) ?? new SognaflowValueState()

        stateCache.set(subject, state)

        const subscriptions: VoidFunction[] = []

        for (const key in values) {
            const value = values[key]
            const remove = addValue(subject, state, key, value)
            subscriptions.push(remove)
        }

        return () => {
            for (const cancel of subscriptions) cancel()
        }
    }
}
