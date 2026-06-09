import { addDomEvent } from "sognaflow-dom";
import { addPointerInfo } from "./event-info.js";
export function addPointerEvent(target, eventName, handler, options) {
    return addDomEvent(target, eventName, addPointerInfo(handler), options);
}
//# sourceMappingURL=add-pointer-event.js.map