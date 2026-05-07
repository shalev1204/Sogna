import { Feature, type VisualElement } from "sognaflow-dom";
import { VisualElementDragControls } from "./VisualElementDragControls.js";
export declare class DragGesture extends Feature<HTMLElement> {
    controls: VisualElementDragControls;
    removeGroupControls: Function;
    removeListeners: Function;
    constructor(node: VisualElement<HTMLElement>);
    mount(): void;
    update(): void;
    unmount(): void;
}
