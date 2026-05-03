"use client"

import { sognaflowValue, sognaflowValueEventCallbacks } from "sognaflow-dom"
import { useInsertionEffect } from "react"

export function usesognaflowValueEvent<
    V,
    EventName extends keyof sognaflowValueEventCallbacks<V>
>(
    value: sognaflowValue<V>,
    event: EventName,
    callback: sognaflowValueEventCallbacks<V>[EventName]
) {
    /**
     * useInsertionEffect will create subscriptions before any other
     * effects will run. Effects run upwards through the tree so it
     * can be that binding a useLayoutEffect higher up the tree can
     * miss changes from lower down the tree.
     */
    useInsertionEffect(
        () => value.on(event, callback),
        [value, event, callback]
    )
}
