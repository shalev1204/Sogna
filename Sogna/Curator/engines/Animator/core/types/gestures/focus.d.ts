import { Feature } from "sognaflow-dom";
export declare class FocusGesture extends Feature<Element> {
    private isActive;
    onFocus(): void;
    onBlur(): void;
    mount(): void;
    unmount(): void;
}
