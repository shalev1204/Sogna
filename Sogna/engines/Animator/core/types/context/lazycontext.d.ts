import { CreateVisualElement } from "../render/types.js";
export interface LazyContextProps {
    renderer?: CreateVisualElement;
    strict: boolean;
}
export declare const LazyContext: import("react").Context<LazyContextProps>;
