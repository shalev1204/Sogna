import { addDomEvent } from "../../events/add-dom-event.js";
import { CreateProjectionNode } from "./create-projection-node.js";
export const DocumentProjectionNode = CreateProjectionNode({
    attachResizeListener: (ref, notify) => addDomEvent(ref, "resize", notify),
    measureScroll: () => ({
        x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
        y: document.documentElement.scrollTop || document.body?.scrollTop || 0,
    }),
    checkIsScrollRoot: () => true,
});
//# sourceMappingURL=DocumentProjectionNode.js.map