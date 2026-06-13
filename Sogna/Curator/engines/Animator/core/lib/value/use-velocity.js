"use client";
import { frame } from "sognaflow-dom";
import { usesognaflowValueEvent } from "../utils/use-sognaflow-value-event";
import { usesognaflowValue } from "./use-sognaflow-value";
/**
 * Creates a `sognaflowValue` that updates when the velocity of the provided `sognaflowValue` changes.
 *
 * ```javascript
 * const x = usesognaflowValue(0)
 * const xVelocity = useVelocity(x)
 * const xAcceleration = useVelocity(xVelocity)
 * ```
 *
 * @public
 */
export function useVelocity(value) {
    const velocity = usesognaflowValue(value.getVelocity());
    const updateVelocity = () => {
        const latest = value.getVelocity();
        velocity.set(latest);
        /**
         * If we still have velocity, schedule an update for the next frame
         * to keep checking until it is zero.
         */
        if (latest)
            frame.update(updateVelocity);
    };
    usesognaflowValueEvent(value, "change", () => {
        // Schedule an update to this value at the end of the current frame.
        frame.update(updateVelocity, false, true);
    });
    return velocity;
}
//# sourceMappingURL=use-velocity.js.map