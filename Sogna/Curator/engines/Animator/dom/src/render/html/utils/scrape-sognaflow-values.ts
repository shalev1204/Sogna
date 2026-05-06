import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value.js"
import type { SognaflowNodeOptions } from "../../../node/types.js"
import { IsForcedSognaflowValue } from "../../utils/is-forced-sognaflow-value.js"
import type { VisualElement } from "../../VisualElement.js"

export function ScrapeSognaflowValuesFromProps(
    props: SognaflowNodeOptions,
    prevProps: SognaflowNodeOptions,
    visualElement?: VisualElement
) {
    const style = (props as any).style
    const prevStyle = (prevProps as any)?.style
    const newValues: { [key: string]: any } = {}

    if (!style) return newValues

    for (const key in style) {
        if (
            IsSognaflowValue(style[key]) ||
            (prevStyle && IsSognaflowValue(prevStyle[key])) ||
            IsForcedSognaflowValue(key, props) ||
            visualElement?.getValue(key)?.liveStyle !== undefined
        ) {
            newValues[key] = style[key]
        }
    }

    return newValues
}

