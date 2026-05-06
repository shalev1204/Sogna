import type { SognaflowNodeOptions } from "../../node/types.js";
import { ScaleCorrectors, AddScaleCorrector } from "../../projection/styles/scale-correction.js";
export { ScaleCorrectors, AddScaleCorrector };
export declare function IsForcedSognaflowValue(key: string, { layout, layoutId }: SognaflowNodeOptions): boolean;
