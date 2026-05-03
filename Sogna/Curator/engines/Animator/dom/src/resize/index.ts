import { ElementOrSelector } from "../utils/resolve-elements"
import { ResizeElement } from "./handle-element"
import { ResizeWindow } from "./handle-window"
import { ResizeHandler, WindowResizeHandler } from "./types"

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
