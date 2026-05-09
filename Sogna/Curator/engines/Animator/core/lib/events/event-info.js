import { isPrimaryPointer } from "sognaflow-dom";
export function extractEventInfo(event) {
    return {
        point: {
            x: event.pageX,
            y: event.pageY,
        },
    };
}
export const addPointerInfo = (handler) => (event) => isPrimaryPointer(event) && handler(event, extractEventInfo(event));
//# sourceMappingURL=event-info.js.map
