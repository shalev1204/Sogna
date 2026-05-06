import { AnimationPlaybackOptions } from "../types.js";
export declare function GetFinalKeyframe<T>(keyframes: T[], { repeat, repeatType }: AnimationPlaybackOptions, finalKeyframe?: T, speed?: number): T;
