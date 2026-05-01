import type { AnyResolvedKeyframe } from "../../animation/types"
import type { sognaflowValue } from "../../value"
import type { sognaflowNodeOptions } from "../../node/types"
import { transformProps } from "../utils/keys-transform"
import { getDefaultValueType } from "../../value/types/maps/defaults"
import { createBox } from "../../projection/geometry/models"
import { DOMVisualElement } from "../dom/DOMVisualElement"
import type { DOMVisualElementOptions } from "../dom/types"
import { camelToDash } from "../dom/utils/camel-to-dash"
import type { ResolvedValues } from "../types"
import type { VisualElement, sognaflowStyle } from "../VisualElement"
import { SVGRenderState } from "./types"
import { buildSVGAttrs } from "./utils/build-attrs"
import { camelCaseAttributes } from "./utils/camel-case-attrs"
import { isSVGTag } from "./utils/is-svg-tag"
import { renderSVG } from "./utils/render"
import { scrapesognaflowValuesFromProps } from "./utils/scrape-sognaflow-values"
export class SVGVisualElement extends DOMVisualElement<
    SVGElement,
    SVGRenderState,
    DOMVisualElementOptions
> {
    type = "svg"

    isSVGTag = false

    getBaseTargetFromProps(
        props: sognaflowNodeOptions,
        key: string
    ): AnyResolvedKeyframe | sognaflowValue<any> | undefined {
        return props[key as keyof sognaflowNodeOptions]
    }

    readValueFromInstance(instance: SVGElement, key: string) {
        if (transformProps.has(key)) {
            const defaultType = getDefaultValueType(key)
            return defaultType ? defaultType.default || 0 : 0
        }
        key = !camelCaseAttributes.has(key) ? camelToDash(key) : key
        return instance.getAttribute(key)
    }

    measureInstanceViewportBox = createBox

    scrapesognaflowValuesFromProps(
        props: sognaflowNodeOptions,
        prevProps: sognaflowNodeOptions,
        visualElement: VisualElement
    ) {
        return scrapesognaflowValuesFromProps(props, prevProps, visualElement)
    }

    build(
        renderState: SVGRenderState,
        latestValues: ResolvedValues,
        props: sognaflowNodeOptions
    ) {
        buildSVGAttrs(
            renderState,
            latestValues,
            this.isSVGTag,
            props.transformTemplate,
            (props as any).style
        )
    }

    renderInstance(
        instance: SVGElement,
        renderState: SVGRenderState,
        styleProp?: sognaflowStyle | undefined,
        projection?: any
    ): void {
        renderSVG(instance, renderState, styleProp, projection)
    }

    mount(instance: SVGElement) {
        this.isSVGTag = isSVGTag(instance.tagName)
        super.mount(instance)
    }
}
