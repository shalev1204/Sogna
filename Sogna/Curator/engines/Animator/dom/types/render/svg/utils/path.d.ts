import { ResolvedValues } from "../../types.js";
/**
 * Build SVG path properties. Uses the path's measured length to convert
 * our custom pathLength, pathSpacing and pathOffset into stroke-dashoffset
 * and stroke-dasharray attributes.
 *
 * This function is mutative to reduce per-frame GC.
 *
 * Note: We use unitless values for stroke-dasharray and stroke-dashoffset
 * because Safari incorrectly scales px values when the page is zoomed.
 */
export declare function BuildSVGPath(attrs: ResolvedValues, length: number, spacing?: number, offset?: number, useDashCase?: boolean): void;
