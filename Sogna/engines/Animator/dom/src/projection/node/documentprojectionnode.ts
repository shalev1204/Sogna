import { addDomEvent } from "../../events/add-dom-event.js"
import { createProjectionNode } from "./create-projection-node.js"

export const DocumentProjectionNode = createProjectionNode<Window>({
    attachResizeListener: (
        ref: Window | Element,
        notify: VoidFunction
    ): VoidFunction => addDomEvent(ref, "resize", notify),
    measureScroll: () => ({
        x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
        y: document.documentElement.scrollTop || document.body?.scrollTop || 0,
    }),
    checkIsScrollRoot: () => true,
})
