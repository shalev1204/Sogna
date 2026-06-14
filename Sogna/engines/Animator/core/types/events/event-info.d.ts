import { EventInfo } from "sognaflow-dom";
export type EventListenerWithPointInfo = (e: PointerEvent, info: EventInfo) => void;
export declare function extractEventInfo(event: PointerEvent): EventInfo;
export declare const addPointerInfo: (handler: EventListenerWithPointInfo) => EventListener;
