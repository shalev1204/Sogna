import { Feature, type PanInfo } from "sognaflow-dom";
export declare class PanGesture extends Feature<Element> {
    private session?;
    private removePointerDownListener;
    onPointerDown(pointerDownEvent: PointerEvent): void;
    createPanHandlers(): {
        onSessionStart: (event: PointerEvent, info: PanInfo) => void;
        onStart: (event: PointerEvent, info: PanInfo) => void;
        onMove: (event: PointerEvent, info: PanInfo) => void;
        onEnd: (event: PointerEvent, info: PanInfo) => void;
    };
    mount(): void;
    update(): void;
    unmount(): void;
}
