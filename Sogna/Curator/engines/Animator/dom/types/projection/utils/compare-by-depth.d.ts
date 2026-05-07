import type { VisualElement } from "../../render/VisualElement.js";
export interface WithDepth {
    depth: number;
}
export declare const compareByDepth: (a: VisualElement, b: VisualElement) => number;
