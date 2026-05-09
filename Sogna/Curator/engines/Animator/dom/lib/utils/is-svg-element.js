import { isObject } from "sognaflow-utils";
/**
 * Checks if an element is an SVG element in a way
 * that works across iframes
 */
export function IsSVGElement(element) {
    return isObject(element) && "ownerSVGElement" in element;
}
//# sourceMappingURL=is-svg-element.js.map
