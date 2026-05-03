import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value"
import type { SognaflowNodeOptions } from "../../../node/types"
import { IsForcedSognaflowValue } from "../../utils/is-forced-sognaflow-value"
import type { VisualElement } from "../../VisualElement"

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

