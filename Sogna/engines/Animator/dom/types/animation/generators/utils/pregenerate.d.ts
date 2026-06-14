import { AnyResolvedKeyframe, KeyframeGenerator } from "../../types.js";
export interface KeyframesMetadata {
    keyframes: Array<AnyResolvedKeyframe>;
    duration: number;
}
export declare function pregenerateKeyframes(generator: KeyframeGenerator<number>): KeyframesMetadata;
