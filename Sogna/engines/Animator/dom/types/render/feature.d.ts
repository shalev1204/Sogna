import type { VisualElement } from "./visualelement.js";
/**
 * Feature base class for extending VisualElement functionality.
 * Features are plugins that can be mounted/unmounted to add behavior
 * like gestures, animations, or layout tracking.
 */
export declare abstract class Feature<T extends any = any> {
    isMounted: boolean;
    node: VisualElement<T>;
    constructor(node: VisualElement<T>);
    abstract mount(): void;
    abstract unmount(): void;
    update(): void;
}
