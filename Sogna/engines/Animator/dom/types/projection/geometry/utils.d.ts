import { Axis, AxisDelta, Box, Delta } from "sognaflow-utils";
export declare function isDeltaZero(delta: Delta): boolean;
export declare function axisEquals(a: Axis, b: Axis): boolean;
export declare function boxEquals(a: Box, b: Box): boolean;
export declare function axisEqualsRounded(a: Axis, b: Axis): boolean;
export declare function boxEqualsRounded(a: Box, b: Box): boolean;
export declare function aspectRatio(box: Box): number;
export declare function axisDeltaEquals(a: AxisDelta, b: AxisDelta): boolean;
