import { sognaflowComponentOptions } from "../../../motion";
import { DOMsognaflowComponents } from "../../dom/types.js";
export declare function createMinimalsognaflowComponent<Props, TagName extends keyof DOMsognaflowComponents | string = "div">(Component: TagName | string | React.ComponentType<Props>, options?: sognaflowComponentOptions): import("../../../motion").sognaflowComponent<TagName, Props>;
