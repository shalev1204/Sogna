import { AnyResolvedKeyframe } from "../../animation/types.js";
import { HSLA, RGBA } from "../../value/types/types.js";
type MixableArray = Array<number | RGBA | HSLA | string>;
interface MixableObject {
    [key: string]: AnyResolvedKeyframe | RGBA | HSLA;
}
export declare function GetMixer<T>(a: T): ((from: import("../../index.js").ColorType | string, to: import("../../index.js").ColorType | string) => (p: number) => string | import("../../index.js").ColorType) | ((origin: AnyResolvedKeyframe, target: AnyResolvedKeyframe) => Function) | typeof MixArray | typeof MixObject;
export declare function MixArray(a: MixableArray, b: MixableArray): (p: number) => (string | number | RGBA | HSLA)[];
export declare function MixObject(a: MixableObject, b: MixableObject): (v: number) => {
    [x: string]: AnyResolvedKeyframe | RGBA | HSLA;
};
export declare const MixComplex: (origin: AnyResolvedKeyframe, target: AnyResolvedKeyframe) => Function;
export declare const mixArray: typeof MixArray;
export declare const mixObject: typeof MixObject;
export declare const mixComplex: (origin: AnyResolvedKeyframe, target: AnyResolvedKeyframe) => Function;
export declare const getMixer: typeof GetMixer;
export {};
