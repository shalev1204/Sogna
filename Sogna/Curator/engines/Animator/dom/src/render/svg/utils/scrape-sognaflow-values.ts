import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value.js"
import type { SognaflowNodeOptions } from "../../../node/types.js"
import { TransformPropOrder } from "../../utils/keys-transform.js"
import { ScrapeSognaflowValuesFromProps as ScrapeHTMLSognaflowValuesFromProps } from "../../html/utils/scrape-sognaflow-values.js"
import type { VisualElement } from "../../VisualElement.js"

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
                TransformPropOrder.indexOf(key) !== -1
                    ? "attr" + key.charAt(0).toUpperCase() + key.substring(1)
                    : key

            newValues[targetKey] = props[key as keyof typeof props]
        }
    }

    return newValues
}

