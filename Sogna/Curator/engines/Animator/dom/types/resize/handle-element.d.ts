import { ElementOrSelector } from "../utils/resolve-elements";
import { ResizeHandler } from "./types";
export declare function ResizeElement(target: ElementOrSelector, handler: ResizeHandler<Element>): () => void;
