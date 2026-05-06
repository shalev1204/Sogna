import { HSLA } from "../types.js";
export declare const Hsla: {
    test: (v: any) => boolean;
    parse: (v: string | import("../types.js").Color) => HSLA;
    transform: ({ hue, saturation, lightness, alpha }: HSLA) => string;
};
