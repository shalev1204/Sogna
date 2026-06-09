import { HSLA, RGBA } from "../types.js";
export declare const Color: {
    test: (v: any) => boolean;
    parse: (v: any) => RGBA | HSLA;
    transform: (v: HSLA | RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
};
export declare const color: {
    test: (v: any) => boolean;
    parse: (v: any) => RGBA | HSLA;
    transform: (v: HSLA | RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
};
