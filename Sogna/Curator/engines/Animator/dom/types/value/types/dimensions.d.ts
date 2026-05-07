/**
 * A list of value types commonly used for dimensions
 */
export declare const DimensionValueTypes: ({
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
} | {
    test: (v: import("../../index.js").AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
} | import("./types.js").ValueType)[];
/**
 * Tests a dimensional value against the list of dimension ValueTypes
 */
export declare const FindDimensionValueType: (v: any) => {
    test: (v: number) => boolean;
    parse: typeof parseFloat;
    transform: (v: number) => number;
} | {
    test: (v: import("../../index.js").AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
} | import("./types.js").ValueType | undefined;
