import type { Box } from "sognaflow-utils";
import { ValueType } from "../../../value/types/types.js";
import { AnyResolvedKeyframe } from "../../types.js";
import { WithRender } from "../types.js";
export declare const IsNumOrPxType: (v?: ValueType) => v is ValueType;
type GetActualMeasurementInPixels = (bbox: Box, computedStyle: Partial<CSSStyleDeclaration>) => number;
type RemovedTransforms = [string, AnyResolvedKeyframe][];
export declare function RemoveNonTranslationalTransform(visualElement: WithRender): RemovedTransforms;
export declare const PositionalValues: {
    [key: string]: GetActualMeasurementInPixels;
};
export {};
