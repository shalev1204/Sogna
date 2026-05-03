import type { VisualElement } from "../../render/visualelement";
export interface WithDepth {
    depth: number;
}
export declare const compareByDepth: (a: VisualElement, b: VisualElement) => number;
