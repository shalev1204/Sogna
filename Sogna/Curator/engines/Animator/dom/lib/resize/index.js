import { ResizeElement } from "./handle-element.js";
import { ResizeWindow } from "./handle-window.js";
export function Resize(a, b) {
    return typeof a === "function" ? ResizeWindow(a) : ResizeElement(a, b);
}
export const resize = Resize;
//# sourceMappingURL=index.js.map
