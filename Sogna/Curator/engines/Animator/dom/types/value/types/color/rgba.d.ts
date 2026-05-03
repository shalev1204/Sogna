import { RGBA } from "../types";
export declare const RgbUnit: {
    transform: (v: number) => number;
    test: (v: number) => boolean;
    parse: typeof parseFloat;
};
export declare const Rgba: {
    test: (v: any) => boolean;
    parse: (v: string | import("../types").Color) => RGBA;
    transform: ({ red, green, blue, alpha }: RGBA) => string;
};
