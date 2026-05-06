import { Color } from "../../value/types/types.js";
export declare const MixLinearColor: (from: number, to: number, v: number) => number;
export declare const MixColor: (from: Color | string, to: Color | string) => (p: number) => string | Color;
