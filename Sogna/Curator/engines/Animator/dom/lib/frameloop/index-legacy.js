import { CancelFrame, Frame } from ".";
import { StepsOrder } from "./order.js";
/**
 * @deprecated
 *
 * Import as `Frame` instead.
 */
export const Sync = Frame;
/**
 * @deprecated
 *
 * Use CancelFrame(callback) instead.
 */
export const CancelSync = StepsOrder.reduce((acc, key) => {
    acc[key] = (process) => CancelFrame(process);
    return acc;
}, {});
//# sourceMappingURL=index-legacy.js.map