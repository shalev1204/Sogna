import type { Box } from "sognaflow-utils";
import { ValueType } from "../../../value/types/types";
import { AnyResolvedKeyframe } from "../../types";
import { WithRender } from "../types";
export declare const IsNumOrPxType: (v?: ValueType) => v is ValueType;
type GetActualMeasurementInPixels = (bbox: Box, computedStyle: Partial<CSSStyleDeclaration>) => number;
type RemovedTransforms = [string, AnyResolvedKeyframe][];
export declare function RemoveNonTranslationalTransform(visualElement: WithRender): RemovedTransforms;
export declare const PositionalValues: {
    [key: string]: GetActualMeasurementInPixels;
};
export {};
