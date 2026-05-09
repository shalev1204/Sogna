"use client";
import { cancelFrame, frame } from "sognaflow-dom";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-effect.js";
import { usesognaflowValue } from "./use-sognaflow-value";
export function useCombinesognaflowValues(values, combineValues) {
    /**
     * Initialise the returned sognaflow value. This remains the same between renders.
     */
    const value = usesognaflowValue(combineValues());
    /**
     * Create a function that will update the template sognaflow value with the latest values.
     * This is pre-bound so whenever a sognaflow value updates it can schedule its
     * execution in Framesync. If it's already been scheduled it won't be fired twice
     * in a single frame.
     */
    const updateValue = () => value.set(combineValues());
    /**
     * Synchronously update the sognaflow value with the latest values during the render.
     * This ensures that within a React render, the styles applied to the DOM are up-to-date.
     */
    updateValue();
    /**
     * Subscribe to all sognaflow values found within the template. Whenever any of them change,
     * schedule an update.
     */
    useIsomorphicLayoutEffect(() => {
        const scheduleUpdate = () => frame.preRender(updateValue, false, true);
        const subscriptions = values.map((v) => v.on("change", scheduleUpdate));
        return () => {
            subscriptions.forEach((unsubscribe) => unsubscribe());
            cancelFrame(updateValue);
        };
    });
    return value;
}
//# sourceMappingURL=use-combine-values.js.map
