/**
 * Tests a value against the list of ValueTypes
 */
export declare const FindValueType: (v: any) => {
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
} | {
    test: (v: import("../../..").AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
} | import("../types").ValueType | {
    test: (v: any) => boolean;
    parse: (v: any) => import("../types").RGBA | import("../types").HSLA;
    transform: (v: import("../types").HSLA | import("../types").RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
} | {
    test: (v: any) => boolean;
    parse: (v: import("../../..").AnyResolvedKeyframe) => import("../complex").ComplexValues;
    createTransformer: (source: import("../../..").AnyResolvedKeyframe) => (v: Array<import("../../..").CSSVariableToken | import("../types").Color | number | string>) => string;
    getAnimatableNone: (v: import("../../..").AnyResolvedKeyframe) => string;
} | undefined;
export declare const findValueType: (v: any) => {
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
} | {
    test: (v: import("../../..").AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
} | import("../types").ValueType | {
    test: (v: any) => boolean;
    parse: (v: any) => import("../types").RGBA | import("../types").HSLA;
    transform: (v: import("../types").HSLA | import("../types").RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
} | {
    test: (v: any) => boolean;
    parse: (v: import("../../..").AnyResolvedKeyframe) => import("../complex").ComplexValues;
    createTransformer: (source: import("../../..").AnyResolvedKeyframe) => (v: Array<import("../../..").CSSVariableToken | import("../types").Color | number | string>) => string;
    getAnimatableNone: (v: import("../../..").AnyResolvedKeyframe) => string;
} | undefined;
