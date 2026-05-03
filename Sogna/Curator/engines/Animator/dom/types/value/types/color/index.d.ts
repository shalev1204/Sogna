import { HSLA, RGBA } from "../types";
export declare const Color: {
    test: (v: any) => boolean;
    parse: (v: any) => RGBA | HSLA;
    transform: (v: HSLA | RGBA | string) => string;
    getAnimatableNone: (v: string) => string;
};
