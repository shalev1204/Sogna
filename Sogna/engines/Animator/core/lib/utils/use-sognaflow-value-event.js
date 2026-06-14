"use client";
import { useInsertionEffect } from "react";
export function usesognaflowValueEvent(value, event, callback) {
    /**
     * useInsertionEffect will create subscriptions before any other
     * effects will run. Effects run upwards through the tree so it
     * can be that binding a useLayoutEffect higher up the tree can
     * miss changes from lower down the tree.
     */
    useInsertionEffect(() => value.on(event, callback), [value, event, callback]);
}
//# sourceMappingURL=use-sognaflow-value-event.js.map