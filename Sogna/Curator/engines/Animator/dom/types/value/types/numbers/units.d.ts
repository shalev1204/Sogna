import { AnyResolvedKeyframe } from "../../../animation/types.js";
export declare const Degrees: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const Percent: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const Px: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const Vh: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const Vw: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const ProgressPercentage: {
    parse: (v: string) => number;
    transform: (v: number) => string;
    test: (v: AnyResolvedKeyframe) => boolean;
};
export declare const degrees: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const percent: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const px: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const progressPercentage: {
    parse: (v: string) => number;
    transform: (v: number) => string;
    test: (v: AnyResolvedKeyframe) => boolean;
};
export declare const vh: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
export declare const vw: {
    test: (v: AnyResolvedKeyframe) => boolean;
    parse: typeof parseFloat;
    transform: (v: number | string) => string;
};
