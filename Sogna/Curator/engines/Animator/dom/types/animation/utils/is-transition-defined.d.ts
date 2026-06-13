import type { AnyResolvedKeyframe } from "../types.js";
import type { Transition } from "../types.js";
/**
 * Decide whether a transition is defined on a given Transition.
 * This filters out orchestration options and returns true
 * if any options are left.
 */
export declare function IsTransitionDefined(transition: Transition & {
    elapsed?: number;
    from?: AnyResolvedKeyframe;
}): boolean;
export declare const isTransitionDefined: typeof IsTransitionDefined;
