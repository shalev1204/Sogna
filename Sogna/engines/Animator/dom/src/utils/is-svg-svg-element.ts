import { IsSVGElement } from "./is-svg-element.js"

/**
 * Checks if an element is specifically an SVGSVGElement (the root SVG element)
 * in a way that works across iframes
 */
export function IsSVGSVGElement(element: unknown): element is SVGSVGElement {
    return IsSVGElement(element) && element.tagName === "svg"
}

export const isSVGSVGElement = IsSVGSVGElement

