import { Process } from "./types";
/**
 * @deprecated
 *
 * Import as `Frame` instead.
 */
export declare const Sync: import("./types").Batcher;
/**
 * @deprecated
 *
 * Use CancelFrame(callback) instead.
 */
export declare const CancelSync: Record<string, (process: Process) => void>;
