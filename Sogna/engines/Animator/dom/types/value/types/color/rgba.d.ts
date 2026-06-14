import { RGBA } from "../types.js";
export declare const RgbUnit: {
    transform: (v: number) => number;
    test: (v: number) => boolean;
    parse: typeof parseFloat;
};
export declare const Rgba: {
    test: (v: any) => boolean;
    parse: (v: string | import("../types.js").Color) => RGBA;
    transform: ({ red, green, blue, alpha }: RGBA) => string;
};
export declare const rgba: {
    test: (v: any) => boolean;
    parse: (v: string | import("../types.js").Color) => RGBA;
    transform: ({ red, green, blue, alpha }: RGBA) => string;
};
export declare const rgbUnit: {
    transform: (v: number) => number;
    test: (v: number) => boolean;
    parse: typeof parseFloat;
};
