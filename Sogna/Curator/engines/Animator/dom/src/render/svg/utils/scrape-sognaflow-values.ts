import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value"
import type { SognaflowNodeOptions } from "../../../node/types"
import { transformPropOrder } from "../../utils/keys-transform"
import { ScrapeSognaflowValuesFromProps as ScrapeHTMLSognaflowValuesFromProps } from "../../html/utils/scrape-sognaflow-values"
import type { VisualElement } from "../../visualelement"

export function ScrapeSognaflowValuesFromProps(
    props: SognaflowNodeOptions,
    prevProps: SognaflowNodeOptions,
    visualElement?: VisualElement
) {
    const newValues = ScrapeHTMLSognaflowValuesFromProps(
        props,
        prevProps,
        visualElement
    )

    for (const key in props) {
        if (
            IsSognaflowValue(props[key as keyof typeof props]) ||
            IsSognaflowValue(prevProps[key as keyof typeof prevProps])
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

