export type DelayedFunction = (overshoot: number) => void;
/**
 * Timeout defined in ms
 */
export declare function Delay(callback: DelayedFunction, timeout: number): () => void;
export declare function DelayInSeconds(callback: DelayedFunction, timeout: number): () => void;
