import { CamelToDash as camelToDash } from "../../dom/utils/camel-to-dash";
import { RenderHTML as renderHTML } from "../../html/utils/render";
import { CamelCaseAttributes as camelCaseAttributes } from "./camel-case-attrs";
export function RenderSVG(element, renderState, _styleProp, projection) {
    renderHTML(element, renderState, undefined, projection);
    for (const key in renderState.attrs) {
        element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
    }
}
//# sourceMappingURL=render.js.map