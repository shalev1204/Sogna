import { UnresolvedValueKeyframe } from "sognaflow-dom";
import { Easing } from "sognaflow-utils";
import type { ValueSequence } from "../types.js";
export declare function eraseKeyframes(sequence: ValueSequence, startTime: number, endTime: number): void;
export declare function addKeyframes(sequence: ValueSequence, keyframes: UnresolvedValueKeyframe[], easing: Easing | Easing[], offset: number[], startTime: number, endTime: number): void;
