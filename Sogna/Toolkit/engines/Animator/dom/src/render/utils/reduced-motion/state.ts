interface ReducedsognaflowState {
    current: boolean | null
}

// Does this device prefer reduced sognaflow? Returns `null` server-side.
export const prefersReducedsognaflow: ReducedsognaflowState = { current: null }

export const hasReducedsognaflowListener = { current: false }
