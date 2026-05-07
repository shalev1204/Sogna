import { AnyResolvedKeyframe } from "../../../animation/types.js";
export declare const Mask: {
    getAnimatableNone: (v: AnyResolvedKeyframe) => string;
    test: (v: any) => boolean;
    parse: (v: AnyResolvedKeyframe) => import(".").ComplexValues;
    createTransformer: (source: AnyResolvedKeyframe) => (v: Array<import("../../..").CSSVariableToken | import("../types").Color | number | string>) => string;
};
