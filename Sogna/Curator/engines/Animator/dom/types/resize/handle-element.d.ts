import { ElementOrSelector } from "../utils/resolve-elements.js";
import { ResizeHandler } from "./types.js";
export declare function ResizeElement(target: ElementOrSelector, handler: ResizeHandler<Element>): () => void;
