import { ResizeElement } from "./handle-element";
import { ResizeWindow } from "./handle-window";
export function Resize(a, b) {
    return typeof a === "function" ? ResizeWindow(a) : ResizeElement(a, b);
}
//# sourceMappingURL=index.js.map