import { issognaflowValue } from "../../../value/utils/is-sognaflow-value"
import type { sognaflowNodeOptions } from "../../../node/types"
import { transformPropOrder } from "../../utils/keys-transform"
import { scrapesognaflowValuesFromProps as scrapeHTMLsognaflowValuesFromProps } from "../../html/utils/scrape-sognaflow-values"
import type { VisualElement } from "../../VisualElement"

export function scrapesognaflowValuesFromProps(
    props: sognaflowNodeOptions,
    prevProps: sognaflowNodeOptions,
    visualElement?: VisualElement
) {
    const newValues = scrapeHTMLsognaflowValuesFromProps(
        props,
        prevProps,
        visualElement
    )

    for (const key in props) {
        if (
            issognaflowValue(props[key as keyof typeof props]) ||
            issognaflowValue(prevProps[key as keyof typeof prevProps])
        ) {
            const targetKey =
                transformPropOrder.indexOf(key) !== -1
                    ? "attr" + key.charAt(0).toUpperCase() + key.substring(1)
                    : key

            newValues[targetKey] = props[key as keyof typeof props]
        }
    }

    return newValues
}
