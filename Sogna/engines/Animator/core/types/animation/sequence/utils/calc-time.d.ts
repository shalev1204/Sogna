import { SequenceTime } from "../types.js";
/**
 * Given a absolute or relative time definition and current/prev time state of the sequence,
 * calculate an absolute time for the next keyframes.
 */
export declare function calcNextTime(current: number, next: SequenceTime, prev: number, labels: Map<string, number>): number;
