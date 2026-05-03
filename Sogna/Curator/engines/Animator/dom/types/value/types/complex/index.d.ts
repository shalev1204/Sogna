import { AnyResolvedKeyframe } from "../../../animation/types";
import { CSSVariableToken } from "../../../animation/utils/is-css-variable";
import { Color as ColorType } from "../types";
declare function test(v: any): boolean;
export type ComplexValues = Array<CSSVariableToken | AnyResolvedKeyframe | ColorType>;
export interface ValueIndexes {
    color: number[];
    number: number[];
    var: number[];
}
export interface ComplexValueInfo {
    values: ComplexValues;
    split: string[];
    indexes: ValueIndexes;
    types: Array<keyof ValueIndexes>;
}
export declare function AnalyseComplexValue(value: AnyResolvedKeyframe): ComplexValueInfo;
declare function parseComplexValue(v: AnyResolvedKeyframe): ComplexValues;
declare function createTransformer(source: AnyResolvedKeyframe): (v: Array<CSSVariableToken | ColorType | number | string>) => string;
declare function getAnimatableNone(v: AnyResolvedKeyframe): string;
export declare const Complex: {
    test: typeof test;
    parse: typeof parseComplexValue;
    createTransformer: typeof createTransformer;
    getAnimatableNone: typeof getAnimatableNone;
};
export {};
