import type { SognaflowNodeOptions } from "../../../node/types.js";
import { ResolvedValues } from "../../types.js";
import { SVGRenderState } from "../types.js";
/**
 * Build SVG visual attributes, like cx and style.transform
 */
export declare function buildSVGAttrs(state: SVGRenderState, { attrX, attrY, attrScale, pathLength, pathSpacing, pathOffset, ...latest }: ResolvedValues, isSVGTag: boolean, transformTemplate?: SognaflowNodeOptions["transformTemplate"], styleProp?: Record<string, any>): void;
