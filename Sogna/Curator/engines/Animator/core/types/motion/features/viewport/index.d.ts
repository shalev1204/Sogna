import { Feature } from "sognaflow-dom";
export declare class InViewFeature extends Feature<Element> {
    private hasEnteredView;
    private isInView;
    private stopObserver?;
    private startObserver;
    mount(): void;
    update(): void;
    unmount(): void;
}
