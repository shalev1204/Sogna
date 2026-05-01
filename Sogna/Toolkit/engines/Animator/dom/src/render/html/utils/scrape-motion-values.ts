import { issognaflowValue } from "../../../value/utils/is-sognaflow-value"
import type { sognaflowNodeOptions } from "../../../node/types"
import { isForcedsognaflowValue } from "../../utils/is-forced-sognaflow-value"
import type { VisualElement } from "../../VisualElement"

export function scrapesognaflowValuesFromProps(
    props: sognaflowNodeOptions,
    prevProps: sognaflowNodeOptions,
    visualElement?: VisualElement
) {
    const style = (props as any).style
    const prevStyle = (prevProps as any)?.style
    const newValues: { [key: string]: any } = {}

    if (!style) return newValues

    for (const key in style) {
        if (
            issognaflowValue(style[key]) ||
            (prevStyle && issognaflowValue(prevStyle[key])) ||
            isForcedsognaflowValue(key, props) ||
            visualElement?.getValue(key)?.liveStyle !== undefined
        ) {
            newValues[key] = style[key]
        }
    }

    return newValues
}
