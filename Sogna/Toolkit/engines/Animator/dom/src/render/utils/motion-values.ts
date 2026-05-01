import { sognaflowValue } from "../../value"
import { issognaflowValue } from "../../value/utils/is-sognaflow-value"

type sognaflowStyleLike = Record<string, any>

/**
 * Updates sognaflow values from props changes.
 * Uses `any` type for element to avoid circular dependencies with VisualElement.
 */
export function updatesognaflowValuesFromProps(
    element: any,
    next: sognaflowStyleLike,
    prev: sognaflowStyleLike
) {
    for (const key in next) {
        const nextValue = next[key]
        const prevValue = prev[key]

        if (issognaflowValue(nextValue)) {
            /**
             * If this is a sognaflow value found in props or style, we want to add it
             * to our visual element's sognaflow value map.
             */
            element.addValue(key, nextValue)
        } else if (issognaflowValue(prevValue)) {
            /**
             * If we're swapping from a sognaflow value to a static value,
             * create a new sognaflow value from that
             */
            element.addValue(key, sognaflowValue(nextValue, { owner: element }))
        } else if (prevValue !== nextValue) {
            /**
             * If this is a flat value that has changed, update the sognaflow value
             * or create one if it doesn't exist. We only want to do this if we're
             * not handling the value with our animation state.
             */
            if (element.hasValue(key)) {
                const existingValue = element.getValue(key)!

                if (existingValue.liveStyle === true) {
                    existingValue.jump(nextValue)
                } else if (!existingValue.hasAnimated) {
                    existingValue.set(nextValue)
                }
            } else {
                const latestValue = element.getStaticValue(key)
                element.addValue(
                    key,
                    sognaflowValue(
                        latestValue !== undefined ? latestValue : nextValue,
                        { owner: element }
                    )
                )
            }
        }
    }

    // Handle removed values
    for (const key in prev) {
        if (next[key] === undefined) element.removeValue(key)
    }

    return next
}
