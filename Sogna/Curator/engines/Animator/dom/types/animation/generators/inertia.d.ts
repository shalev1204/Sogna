import { KeyframeGenerator, ValueAnimationOptions } from "../types";
export declare function inertia({ keyframes, velocity, power, timeConstant, bounceDamping, bounceStiffness, modifyTarget, min, max, restDelta, restSpeed, }: ValueAnimationOptions<number>): KeyframeGenerator<number>;
