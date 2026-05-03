import type { Box } from "sognaflow-utils"
import type { AnyResolvedKeyframe } from "../../animation/types"
import { isCSSVariableName } from "../../animation/utils/is-css-variable"
import type { SognaflowNodeOptions } from "../../node/types"
import { transformProps } from "../utils/keys-transform"
import {
    defaultTransformValue,
    readTransformValue,
} from "../dom/parse-transform"
import { measureViewportBox } from "../../projection/utils/measure"
import { DOMVisualElement } from "../dom/DOMVisualElement"
import type { DOMVisualElementOptions } from "../dom/types"
import type { ResolvedValues, SognaflowConfigContextProps } from "../types"
import type { VisualElement } from "../VisualElement"
import { HTMLRenderState } from "./types"
import { buildHTMLStyles } from "./utils/build-styles"
import { renderHTML } from "./utils/render"
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values"

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
        if (transformProps.has(key)) {
            return this.projection?.isProjecting
                ? defaultTransformValue(key)
                : readTransformValue(instance, key)
        } else {
            const computedStyle = getComputedStyle(instance)
            const value =
                (isCSSVariableName(key)
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
