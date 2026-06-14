import { RefObject } from "react";
/**
 * @deprecated useElementScroll is deprecated. Convert to useScroll({ container: ref })
 */
export declare function useElementScroll(ref: RefObject<HTMLElement | null>): {
    scrollX: import("sognaflow-dom").sognaflowValue<number>;
    scrollY: import("sognaflow-dom").sognaflowValue<number>;
    scrollXProgress: import("sognaflow-dom").sognaflowValue<number>;
    scrollYProgress: import("sognaflow-dom").sognaflowValue<number>;
};
