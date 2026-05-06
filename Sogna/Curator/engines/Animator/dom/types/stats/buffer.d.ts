import type { StatsRecording } from "./types.js";
export type InactiveStatsBuffer = {
    value: null;
    addProjectionMetrics: null;
};
export type ActiveStatsBuffer = {
    value: StatsRecording;
    addProjectionMetrics: (metrics: {
        nodes: number;
        calculatedTargetDeltas: number;
        calculatedProjections: number;
    }) => void;
};
export declare const StatsBuffer: InactiveStatsBuffer | ActiveStatsBuffer;
