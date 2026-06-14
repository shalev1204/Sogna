import { supportsFlags } from "./flags.js";
export declare function memoSupports<T extends any>(callback: () => T, supportsFlag: keyof typeof supportsFlags): () => boolean | T;
