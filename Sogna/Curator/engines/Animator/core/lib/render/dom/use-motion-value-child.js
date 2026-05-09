"use client";
import { useConstant } from "../../utils/use-constant.js";
import { usesognaflowValueEvent } from "../../utils/use-sognaflow-value-event";
export function usesognaflowValueChild(children, visualElement) {
    const render = useConstant(() => children.get());
    usesognaflowValueEvent(children, "change", (latest) => {
        if (visualElement && visualElement.current) {
            visualElement.current.textContent = `${latest}`;
        }
    });
    return render;
}
//# sourceMappingURL=use-motion-value-child.js.map
