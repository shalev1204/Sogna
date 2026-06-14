import type { SognaflowStyle } from "../../visualelement.js"
import { camelToDash } from "../../dom/utils/camel-to-dash.js"
import { renderHTML } from "../../html/utils/render.js"
import { SVGRenderState } from "../types.js"
import { camelCaseAttributes } from "./camel-case-attrs.js"

export function renderSVG(
    element: SVGElement,
    renderState: SVGRenderState,
    _styleProp?: SognaflowStyle,
    projection?: any
) {
    renderHTML(element as any, renderState, undefined, projection)

    for (const key in renderState.attrs) {
        element.setAttribute(
            !camelCaseAttributes.has(key) ? camelToDash(key) : key,
            renderState.attrs[key] as string
        )
    }
}
