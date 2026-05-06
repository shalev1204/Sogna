import type { StatsRecording } from "./types.js"

export type InactiveStatsBuffer = {
    value: null
    addProjectionMetrics: null
}

export type ActiveStatsBuffer = {
    value: StatsRecording
    addProjectionMetrics: (metrics: {
        nodes: number
        calculatedTargetDeltas: number
        calculatedProjections: number
    }) => void
}

export const StatsBuffer: InactiveStatsBuffer | ActiveStatsBuffer = {
    value: null,
    addProjectionMetrics: null,
}
