import type { VisualElement } from "../../render/visualelement.js"

export interface WithDepth {
    depth: number
}

export const compareByDepth = (a: VisualElement, b: VisualElement) =>
    a.depth - b.depth
