import { ElementOrSelector } from "../utils/resolve-elements";
import { ResizeHandler, WindowResizeHandler } from "./types";
export declare function Resize(onResize: WindowResizeHandler): VoidFunction;
export declare function Resize(target: ElementOrSelector, onResize: ResizeHandler<Element>): VoidFunction;
