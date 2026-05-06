import { Process } from "./types.js";
/**
 * @deprecated
 *
 * Import as `Frame` instead.
 */
export declare const Sync: import("./types.js").Batcher;
/**
 * @deprecated
 *
 * Use CancelFrame(callback) instead.
 */
export declare const CancelSync: Record<string, (process: Process) => void>;
