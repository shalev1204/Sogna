import type { Box } from "sognaflow-utils"
import type { AnyResolvedKeyframe } from "../../animation/types.js"
import { IsCSSVariableName } from "../../animation/utils/is-css-variable.js"
import type { SognaflowNodeOptions } from "../../node/types.js"
import { TransformProps } from "../utils/keys-transform.js"
import {
    defaultTransformValue,
    readTransformValue,
} from "../dom/parse-transform.js"
import { measureViewportBox } from "../../projection/utils/measure.js"
import { DOMVisualElement } from "../dom/DOMVisualElement.js"
import type { DOMVisualElementOptions } from "../dom/types.js"
import type { ResolvedValues, SognaflowConfigContextProps } from "../types.js"
import type { VisualElement } from "../VisualElement.js"
import { HTMLRenderState } from "./types.js"
import { buildHTMLStyles } from "./utils/build-styles.js"
import { renderHTML } from "./utils/render.js"
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values.js"

export function getComputedStyle(element: HTMLElement) {
    return window.getComputedStyle(element)
}

export class HTMLVisualElement extends DOMVisualElement<
    HTMLElement,
    HTMLRenderState,
    DOMVisualElementOptions
> {
    type = "html"

    readValueFromInstance(
        instance: HTMLElement,
        key: string
    ): AnyResolvedKeyframe | null | undefined {
        if (TransformProps.has(key)) {
            return this.projection?.isProjecting
                ? defaultTransformValue(key)
                : readTransformValue(instance, key)
        } else {
            const computedStyle = getComputedStyle(instance)
            const value =
                (IsCSSVariableName(key)
                    ? computedStyle.getPropertyValue(key)
                    : computedStyle[key as keyof typeof computedStyle]) || 0

            return typeof value === "string" ? value.trim() : (value as number)
        }
    }

    measureInstanceViewportBox(
        instance: HTMLElement,
        { transformPagePoint }: SognaflowNodeOptions & Partial<SognaflowConfigContextProps>
    ): Box {
        return measureViewportBox(instance, transformPagePoint)
    }

    build(
        renderState: HTMLRenderState,
        latestValues: ResolvedValues,
        props: SognaflowNodeOptions
    ) {
        buildHTMLStyles(renderState, latestValues, props.transformTemplate)
    }

    ScrapeSognaflowValuesFromProps(
        props: SognaflowNodeOptions,
        prevProps: SognaflowNodeOptions,
        visualElement: VisualElement
    ) {
        return ScrapeSognaflowValuesFromProps(props, prevProps, visualElement)
    }

    renderInstance = renderHTML
}
