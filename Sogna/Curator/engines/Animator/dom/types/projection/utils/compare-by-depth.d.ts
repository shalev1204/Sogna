import type { VisualElement } from "../../render/visualelement.js";
export interface WithDepth {
    depth: number;
}
export declare const compareByDepth: (a: VisualElement, b: VisualElement) => number;
