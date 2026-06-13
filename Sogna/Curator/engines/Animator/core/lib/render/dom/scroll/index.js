import { noop } from "sognaflow-utils";
import { attachToAnimation } from "./attach-animation.js";
import { attachToFunction } from "./attach-function.js";
export function scroll(onScroll, { axis = "y", container = document.scrollingElement, ...options } = {}) {
    if (!container)
        return noop;
    const optionsWithDefaults = { axis, container, ...options };
    return typeof onScroll === "function"
        ? attachToFunction(onScroll, optionsWithDefaults)
        : attachToAnimation(onScroll, optionsWithDefaults);
}
//# sourceMappingURL=index.js.map