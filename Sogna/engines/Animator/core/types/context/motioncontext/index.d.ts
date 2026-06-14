import type { VisualElement } from "sognaflow-dom";
export interface sognaflowContextProps<Instance = unknown> {
    visualElement?: VisualElement<Instance>;
    initial?: false | string | string[];
    animate?: string | string[];
}
export declare const sognaflowContext: import("react").Context<sognaflowContextProps<unknown>>;
