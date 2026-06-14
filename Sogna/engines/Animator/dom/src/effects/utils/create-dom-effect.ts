import {
    ElementOrSelector,
    ResolveElements,
} from "../../utils/resolve-elements.js"
import { SognaflowValue } from "../../value"

export function createSelectorEffect<T>(
    subjectEffect: (
        subject: T,
        values: Record<string, SognaflowValue>
    ) => VoidFunction
) {
    return (
        subject: ElementOrSelector,
        values: Record<string, SognaflowValue>
    ) => {
        const elements = ResolveElements(subject)
        const subscriptions: VoidFunction[] = []

        for (const element of elements) {
            const remove = subjectEffect(element as T, values)
            subscriptions.push(remove)
        }

        return () => {
            for (const remove of subscriptions) remove()
        }
    }
}
