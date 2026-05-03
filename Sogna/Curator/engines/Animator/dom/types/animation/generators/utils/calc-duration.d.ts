import { KeyframeGenerator } from "../../types";
/**
 * Implement a practical max duration for keyframe generation
 * to prevent infinite loops
 */
export declare const maxGeneratorDuration = 20000;
export declare function calcGeneratorDuration(generator: KeyframeGenerator<unknown>): number;
