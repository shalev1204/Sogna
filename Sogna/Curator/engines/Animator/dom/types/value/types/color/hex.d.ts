import { RGBA } from "../types.js";
declare function ParseHex(v: string): RGBA;
export declare const Hex: {
    test: (v: any) => boolean;
    parse: typeof ParseHex;
    transform: ({ red, green, blue, alpha }: RGBA) => string;
};
export {};
