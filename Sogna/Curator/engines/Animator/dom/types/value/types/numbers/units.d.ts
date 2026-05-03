import { AnyResolvedKeyframe } from "../../../animation/types";
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
