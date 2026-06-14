import { RefObject } from "react";
import { InViewOptions } from "../render/dom/viewport";
export interface UseInViewOptions extends Omit<InViewOptions, "root" | "amount"> {
    root?: RefObject<Element | null>;
    once?: boolean;
    amount?: "some" | "all" | number;
    initial?: boolean;
}
export declare function useInView(ref: RefObject<Element | null>, { root, margin, amount, once, initial, }?: UseInViewOptions): boolean;
