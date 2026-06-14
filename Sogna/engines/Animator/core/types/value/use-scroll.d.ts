import { sognaflowValue } from "sognaflow-dom";
import { RefObject } from "react";
import { ScrollInfoOptions } from "../render/dom/scroll/types.js";
export interface UseScrollOptions extends Omit<ScrollInfoOptions, "container" | "target"> {
    container?: RefObject<HTMLElement | null>;
    target?: RefObject<HTMLElement | null>;
}
export declare function useScroll({ container, target, ...options }?: UseScrollOptions): {
    scrollX: sognaflowValue<number>;
    scrollY: sognaflowValue<number>;
    scrollXProgress: sognaflowValue<number>;
    scrollYProgress: sognaflowValue<number>;
};
