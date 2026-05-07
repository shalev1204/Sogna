import { isObject } from "sognaflow-utils"

/**
 * Checks if an element is an HTML element in a way
 * that works across iframes
 */
export function IsHTMLElement(element: unknown): element is HTMLElement {
    return (
        isObject(element) &&
        "offsetHeight" in element &&
        !("ownerSVGElement" in element)
    )
}

export const isHTMLElement = IsHTMLElement
