import { ElementOrSelector } from "../utils/resolve-elements.js"
import { ResizeElement } from "./handle-element.js"
import { ResizeWindow } from "./handle-window.js"
import { ResizeHandler, WindowResizeHandler } from "./types.js"

export function Resize(onResize: WindowResizeHandler): VoidFunction
export function Resize(
    target: ElementOrSelector,
    onResize: ResizeHandler<Element>
): VoidFunction
export function Resize(
    a: WindowResizeHandler | ElementOrSelector,
    b?: ResizeHandler<Element>
) {
    return typeof a === "function" ? ResizeWindow(a) : ResizeElement(a, b!)
}
