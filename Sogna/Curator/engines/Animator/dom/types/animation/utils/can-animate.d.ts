import { ResolvedKeyframes } from "../keyframes/keyframesresolver";
import { AnimationGeneratorType } from "../types";
export declare function CanAnimate(keyframes: ResolvedKeyframes<any>, name?: string, type?: AnimationGeneratorType, velocity?: number): number | boolean | undefined;
