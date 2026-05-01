import { sognaflowValue } from "../../value"
import { sognaflowValueState } from "../sognaflowValueState"

export function createEffect<Subject extends object>(
    addValue: (
        subject: Subject,
        state: sognaflowValueState,
        key: string,
        value: sognaflowValue
    ) => VoidFunction
) {
    const stateCache = new WeakMap<Subject, sognaflowValueState>()

    return (
        subject: Subject,
        values: Record<string, sognaflowValue>
    ): VoidFunction => {
        const state = stateCache.get(subject) ?? new sognaflowValueState()

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
