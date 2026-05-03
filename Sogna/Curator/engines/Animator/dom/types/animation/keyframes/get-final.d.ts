import { AnimationPlaybackOptions } from "../types";
export declare function GetFinalKeyframe<T>(keyframes: T[], { repeat, repeatType }: AnimationPlaybackOptions, finalKeyframe?: T, speed?: number): T;
