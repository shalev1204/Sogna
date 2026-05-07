export declare const Filter: {
    getAnimatableNone: (v: string) => string;
    test: (v: any) => boolean;
    parse: (v: import("../../..").AnyResolvedKeyframe) => import(".").ComplexValues;
    createTransformer: (source: import("../../..").AnyResolvedKeyframe) => (v: Array<import("../../..").CSSVariableToken | import("../types").Color | number | string>) => string;
};
