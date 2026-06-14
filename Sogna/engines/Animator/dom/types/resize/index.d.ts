import { ElementOrSelector } from "../utils/resolve-elements.js";
import { ResizeHandler, WindowResizeHandler } from "./types.js";
export declare function Resize(onResize: WindowResizeHandler): VoidFunction;
export declare function Resize(target: ElementOrSelector, onResize: ResizeHandler<Element>): VoidFunction;
export declare const resize: typeof Resize;
