"use client"

import { collectsognaflowValues, type sognaflowValue } from "sognaflow-dom"
import { useCombinesognaflowValues } from "./use-combine-values"

export function useComputed<O>(compute: () => O): sognaflowValue<O> {
    /**
     * Open session of collectsognaflowValues. Any sognaflowValue that calls get()
     * will be saved into this array.
     */
    collectsognaflowValues.current = []

    compute()

    const value = useCombinesognaflowValues(collectsognaflowValues.current, compute)

    /**
     * Synchronously close session of collectsognaflowValues.
     */
    collectsognaflowValues.current = undefined

    return value
}
