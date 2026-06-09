import type { SognaflowNodeOptions } from "../../node/types.js";
import { scaleCorrectors, addScaleCorrector } from "../../projection/styles/scale-correction.js";
export { scaleCorrectors, addScaleCorrector };
export declare function IsForcedSognaflowValue(key: string, { layout, layoutId }: SognaflowNodeOptions): boolean;
