"use client";
import { collectsognaflowValues } from "sognaflow-dom";
import { useCombinesognaflowValues } from "./use-combine-values.js";
export function useComputed(compute) {
    /**
     * Open session of collectsognaflowValues. Any sognaflowValue that calls get()
     * will be saved into this array.
     */
    collectsognaflowValues.current = [];
    compute();
    const value = useCombinesognaflowValues(collectsognaflowValues.current, compute);
    /**
     * Synchronously close session of collectsognaflowValues.
     */
    collectsognaflowValues.current = undefined;
    return value;
}
//# sourceMappingURL=use-computed.js.map