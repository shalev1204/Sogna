import { ValueKeyframesDefinition, ValueTransition } from "../types";
export declare function StartWaapiAnimation(element: Element, valueName: string, keyframes: ValueKeyframesDefinition, { delay, duration, repeat, repeatType, ease, times, }?: ValueTransition, pseudoElement?: string | undefined): Animation;
