import type { EasingFunction } from "./types";
export type Direction = "start" | "end";
export declare function steps(numSteps: number, direction?: Direction): EasingFunction;
