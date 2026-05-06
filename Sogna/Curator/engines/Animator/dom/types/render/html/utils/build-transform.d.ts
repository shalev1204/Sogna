import { ResolvedValues } from "../../types.js";
import { HTMLRenderState } from "../types.js";
import type { SognaflowNodeOptions } from "../../../node/types.js";
/**
 * Build a CSS transform style from individual x/y/scale etc properties.
 *
 * This outputs with a default order of transforms/scales/rotations, this can be customised by
 * providing a transformTemplate function.
 */
export declare function BuildTransform(latestValues: ResolvedValues, transform: HTMLRenderState["transform"], transformTemplate?: SognaflowNodeOptions["transformTemplate"]): string;
