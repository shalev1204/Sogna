import type { SognaflowNodeOptions } from "../../../node/types";
import { ResolvedValues } from "../../types";
import { SVGRenderState } from "../types";
/**
 * Build SVG visual attributes, like cx and style.transform
 */
export declare function BuildSVGAttrs(state: SVGRenderState, { attrX, attrY, attrScale, pathLength, pathSpacing, pathOffset, ...latest }: ResolvedValues, isSVGTag: boolean, transformTemplate?: SognaflowNodeOptions["transformTemplate"], styleProp?: Record<string, any>): void;
