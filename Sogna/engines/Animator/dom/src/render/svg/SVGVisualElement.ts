import type { AnyResolvedKeyframe } from "../../animation/types.js"
import type { SognaflowValue } from "../../value"
import type { SognaflowNodeOptions } from "../../node/types.js"
import { TransformProps } from "../utils/keys-transform.js"
import { GetDefaultValueType } from "../../value/types/maps/defaults.js"
import { createBox } from "../../projection/geometry/models.js"
import { DOMVisualElement } from "../dom/domvisualelement.js"
import type { DOMVisualElementOptions } from "../dom/types.js"
import { camelToDash } from "../dom/utils/camel-to-dash.js"
import type { ResolvedValues } from "../types.js"
import type { VisualElement, SognaflowStyle } from "../visualelement.js"
import { SVGRenderState } from "./types.js"
import { buildSVGAttrs } from "./utils/build-attrs.js"
import { camelCaseAttributes } from "./utils/camel-case-attrs.js"
import { isSVGTag } from "./utils/is-svg-tag.js"
import { renderSVG } from "./utils/render.js"
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values.js"
export class SVGVisualElement extends DOMVisualElement<
    SVGElement,
    SVGRenderState,
    DOMVisualElementOptions
> {
    type = "svg"

    isSVGTag = false

    getBaseTargetFromProps(
        props: SognaflowNodeOptions,
        key: string
    ): AnyResolvedKeyframe | SognaflowValue<any> | undefined {
        return props[key as keyof SognaflowNodeOptions]
    }

    readValueFromInstance(instance: SVGElement, key: string) {
        if (TransformProps.has(key)) {
            const defaultType = GetDefaultValueType(key)
            return defaultType ? defaultType.default || 0 : 0
        }
        key = !camelCaseAttributes.has(key) ? camelToDash(key) : key
        return instance.getAttribute(key)
    }

    measureInstanceViewportBox = createBox

    ScrapeSognaflowValuesFromProps(
        props: SognaflowNodeOptions,
        prevProps: SognaflowNodeOptions,
        visualElement: VisualElement
    ) {
        return ScrapeSognaflowValuesFromProps(props, prevProps, visualElement)
    }

    build(
        renderState: SVGRenderState,
        latestValues: ResolvedValues,
        props: SognaflowNodeOptions
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
        styleProp?: SognaflowStyle | undefined,
        projection?: any
    ): void {
        renderSVG(instance, renderState, styleProp, projection)
    }

    mount(instance: SVGElement) {
        this.isSVGTag = isSVGTag(instance.tagName)
        super.mount(instance)
    }
}
