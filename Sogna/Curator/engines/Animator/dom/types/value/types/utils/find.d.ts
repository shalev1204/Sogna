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
} | import("../types.js").ValueType | {
    test: (v: any) => boolean;
    parse: (v: any) => import("../types.js").RGBA | import("../types.js").HSLA;
    transform: (v: import("../types.js").HSLA | import("../types.js").RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
} | {
    test: (v: any) => boolean;
    parse: (v: import("../../..").AnyResolvedKeyframe) => import("../complex").ComplexValues;
    createTransformer: (source: import("../../..").AnyResolvedKeyframe) => (v: Array<import("../../..").CSSVariableToken | import("../types.js").Color | number | string>) => string;
    getAnimatableNone: (v: import("../../..").AnyResolvedKeyframe) => string;
} | undefined;
