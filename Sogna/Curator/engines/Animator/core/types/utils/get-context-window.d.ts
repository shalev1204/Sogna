import type { VisualElement } from "sognaflow-dom";
export declare const getContextWindow: ({ current }: VisualElement<Element>) => (Window & typeof globalThis) | null;
