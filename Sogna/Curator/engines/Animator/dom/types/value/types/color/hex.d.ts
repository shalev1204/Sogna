import { RGBA } from "../types";
declare function ParseHex(v: string): RGBA;
export declare const Hex: {
    test: (v: any) => boolean;
    parse: typeof ParseHex;
    transform: ({ red, green, blue, alpha }: RGBA) => string;
};
export {};
