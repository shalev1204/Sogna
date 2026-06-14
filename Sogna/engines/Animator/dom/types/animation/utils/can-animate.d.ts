import { ResolvedKeyframes } from "../keyframes/keyframesresolver.js";
import { AnimationGeneratorType } from "../types.js";
export declare function canAnimate(keyframes: ResolvedKeyframes<any>, name?: string, type?: AnimationGeneratorType, velocity?: number): number | boolean | undefined;
