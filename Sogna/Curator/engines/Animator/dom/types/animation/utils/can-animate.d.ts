import { ResolvedKeyframes } from "../keyframes/keyframesresolver.js";
import { AnimationGeneratorType } from "../types.js";
export declare function CanAnimate(keyframes: ResolvedKeyframes<any>, name?: string, type?: AnimationGeneratorType, velocity?: number): number | boolean | undefined;
