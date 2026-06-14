"use client";
import { frame } from "sognaflow-dom";
import { sognaflowGlobalConfig } from "sognaflow-utils";
import { useEffect, useRef } from "react";
import { useInstantLayoutTransition } from "../projection/use-instant-layout-transition.js";
import { useForceUpdate } from "./use-force-update.js";
export function useInstantTransition() {
    const [forceUpdate, forcedRenderCount] = useForceUpdate();
    const startInstantLayoutTransition = useInstantLayoutTransition();
    const unlockOnFrameRef = useRef(-1);
    useEffect(() => {
        /**
         * Unblock after two animation frames, otherwise this will unblock too soon.
         */
        frame.postRender(() => frame.postRender(() => {
            /**
             * If the callback has been called again after the effect
             * triggered this 2 frame delay, don't unblock animations. This
             * prevents the previous effect from unblocking the current
             * instant transition too soon. This becomes more likely when
             * used in conjunction with React.startTransition().
             */
            if (forcedRenderCount !== unlockOnFrameRef.current)
                return;
            sognaflowGlobalConfig.instantAnimations = false;
        }));
    }, [forcedRenderCount]);
    return (callback) => {
        startInstantLayoutTransition(() => {
            sognaflowGlobalConfig.instantAnimations = true;
            forceUpdate();
            callback();
            unlockOnFrameRef.current = forcedRenderCount + 1;
        });
    };
}
export function disableInstantTransitions() {
    sognaflowGlobalConfig.instantAnimations = false;
}
//# sourceMappingURL=use-instant-transition.js.map