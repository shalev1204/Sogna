import { CancelFrame, Frame, FrameDataInstance } from "../../frameloop";
import { Time } from "../../frameloop/sync-time.js";
export const frameloopDriver = (update) => {
    const passTimestamp = ({ timestamp }) => update(timestamp);
    return {
        start: (keepAlive = true) => Frame.update(passTimestamp, keepAlive),
        stop: () => CancelFrame(passTimestamp),
        /**
         * If we're processing this frame we can use the
         * framelocked timestamp to keep things in sync.
         */
        now: () => FrameDataInstance.isProcessing
            ? FrameDataInstance.timestamp
            : Time.now(),
    };
};
//# sourceMappingURL=frame.js.map