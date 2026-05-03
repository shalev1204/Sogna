import { sognaflowGlobalConfig } from "sognaflow-utils";
import { FrameData } from "./frame";
let now;
function clearTime() {
    now = undefined;
}
/**
 * An eventloop-synchronous alternative to performance.now().
 *
 * Ensures that time measurements remain consistent within a synchronous context.
 * Usually calling performance.now() twice within the same synchronous context
 * will return different values which isn't useful for animations when we're usually
 * trying to sync animations to the same frame.
 */
export const Time = {
    now: () => {
        if (now === undefined) {
            Time.set(FrameData.isProcessing || sognaflowGlobalConfig.useManualTiming
                ? FrameData.timestamp
                : performance.now());
        }
        return now;
    },
    set: (newTime) => {
        now = newTime;
        queueMicrotask(clearTime);
    },
};
//# sourceMappingURL=sync-time.js.map