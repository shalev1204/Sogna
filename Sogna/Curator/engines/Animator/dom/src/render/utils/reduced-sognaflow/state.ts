interface ReducedSognaflowState {
    current: boolean | null
}

// Does this device prefer reduced sognaflow? Returns `null` server-side.
export const PrefersReducedSognaflow: ReducedSognaflowState = { current: null }

export const HasReducedSognaflowListener = { current: false }
