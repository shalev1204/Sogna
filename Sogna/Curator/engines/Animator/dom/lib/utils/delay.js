import { CancelFrame, Frame } from "../frameloop";
import { Time } from "../frameloop/sync-time.js";
import { secondsToMilliseconds } from "sognaflow-utils";
/**
 * Timeout defined in ms
 */
export function Delay(callback, timeout) {
    const start = Time.now();
    const checkElapsed = ({ timestamp }) => {
        const elapsed = timestamp - start;
        if (elapsed >= timeout) {
            CancelFrame(checkElapsed);
            callback(elapsed - timeout);
        }
    };
    Frame.setup(checkElapsed, true);
    return () => CancelFrame(checkElapsed);
}
export function DelayInSeconds(callback, timeout) {
    return Delay(callback, secondsToMilliseconds(timeout));
}
//# sourceMappingURL=delay.js.map