import { ScrollOptionsWithDefaults } from "../types.js";
/**
 * Currently, we only support element tracking with `scrollInfo`, though in
 * the future we can also offer ViewTimeline support.
 */
export declare function isElementTracking(options?: ScrollOptionsWithDefaults): Element | import("../types.js").ScrollOffset | undefined;
