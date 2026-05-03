import { HSLA } from "../types";
export declare const Hsla: {
    test: (v: any) => boolean;
    parse: (v: string | import("../types").Color) => HSLA;
    transform: ({ hue, saturation, lightness, alpha }: HSLA) => string;
};
