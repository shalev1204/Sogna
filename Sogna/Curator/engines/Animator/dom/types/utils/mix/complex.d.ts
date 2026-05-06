import { AnyResolvedKeyframe } from "../../animation/types.js";
import { HSLA, RGBA } from "../../value/types/types.js";
type MixableArray = Array<number | RGBA | HSLA | string>;
interface MixableObject {
    [key: string]: AnyResolvedKeyframe | RGBA | HSLA;
}
export declare function GetMixer<T>(a: T): ((from: import("../..").IColor | string, to: import("../..").IColor | string) => (p: number) => string | import("../..").IColor) | ((origin: AnyResolvedKeyframe, target: AnyResolvedKeyframe) => Function) | typeof MixArray | typeof MixObject;
export declare function MixArray(a: MixableArray, b: MixableArray): (p: number) => (string | number | RGBA | HSLA)[];
export declare function MixObject(a: MixableObject, b: MixableObject): (v: number) => {
    [x: string]: AnyResolvedKeyframe | RGBA | HSLA;
};
export declare const MixComplex: (origin: AnyResolvedKeyframe, target: AnyResolvedKeyframe) => Function;
export {};
