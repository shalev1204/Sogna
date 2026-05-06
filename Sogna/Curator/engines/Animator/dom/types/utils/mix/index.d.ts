import { Mixer } from "./types.js";
export declare function Mix<T>(from: T, to: T): Mixer<T>;
export declare function Mix(from: number, to: number, p: number): number;
