import { camelToDash } from "../../dom/utils/camel-to-dash.js";
import { renderHTML } from "../../html/utils/render.js";
import { camelCaseAttributes } from "./camel-case-attrs.js";
export function renderSVG(element, renderState, _styleProp, projection) {
    renderHTML(element, renderState, undefined, projection);
    for (const key in renderState.attrs) {
        element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
    }
}
//# sourceMappingURL=render.js.map