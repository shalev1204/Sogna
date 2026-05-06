import { CancelFrame, Frame, FrameData } from "../frameloop";
import { ActiveAnimations as activeAnimations } from "./animation-count.js";
import { StatsBuffer } from "./buffer.js";
function Record() {
    const { value } = StatsBuffer;
    if (value === null) {
        CancelFrame(Record);
        return;
    }
    value.frameloop.rate.push(FrameData.delta);
    value.animations.mainThread.push(activeAnimations.mainThread);
    value.animations.waapi.push(activeAnimations.waapi);
    value.animations.layout.push(activeAnimations.layout);
}
function Mean(values) {
    return values.reduce((acc, value) => acc + value, 0) / values.length;
}
function Summarise(values, calcAverage = Mean) {
    if (values.length === 0) {
        return {
            min: 0,
            max: 0,
            avg: 0,
        };
    }
    return {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: calcAverage(values),
    };
}
const MsToFps = (ms) => Math.round(1000 / ms);
function ClearStatsBuffer() {
    StatsBuffer.value = null;
    StatsBuffer.addProjectionMetrics = null;
}
function ReportStats() {
    const { value } = StatsBuffer;
    if (!value) {
        throw new Error("Stats are not being measured");
    }
    ClearStatsBuffer();
    CancelFrame(Record);
    const summary = {
        frameloop: {
            setup: Summarise(value.frameloop.setup),
            rate: Summarise(value.frameloop.rate),
            read: Summarise(value.frameloop.read),
            resolveKeyframes: Summarise(value.frameloop.resolveKeyframes),
            preUpdate: Summarise(value.frameloop.preUpdate),
            update: Summarise(value.frameloop.update),
            preRender: Summarise(value.frameloop.preRender),
            render: Summarise(value.frameloop.render),
            postRender: Summarise(value.frameloop.postRender),
        },
        animations: {
            mainThread: Summarise(value.animations.mainThread),
            waapi: Summarise(value.animations.waapi),
            layout: Summarise(value.animations.layout),
        },
        layoutProjection: {
            nodes: Summarise(value.layoutProjection.nodes),
            calculatedTargetDeltas: Summarise(value.layoutProjection.calculatedTargetDeltas),
            calculatedProjections: Summarise(value.layoutProjection.calculatedProjections),
        },
    };
    /**
     * Convert the rate to FPS
     */
    const { rate } = summary.frameloop;
    rate.min = MsToFps(rate.min);
    rate.max = MsToFps(rate.max);
    rate.avg = MsToFps(rate.avg);
    [rate.min, rate.max] = [rate.max, rate.min];
    return summary;
}
export function RecordStats() {
    if (StatsBuffer.value) {
        ClearStatsBuffer();
        throw new Error("Stats are already being measured");
    }
    const newStatsBuffer = StatsBuffer;
    newStatsBuffer.value = {
        frameloop: {
            setup: [],
            rate: [],
            read: [],
            resolveKeyframes: [],
            preUpdate: [],
            update: [],
            preRender: [],
            render: [],
            postRender: [],
        },
        animations: {
            mainThread: [],
            waapi: [],
            layout: [],
        },
        layoutProjection: {
            nodes: [],
            calculatedTargetDeltas: [],
            calculatedProjections: [],
        },
    };
    newStatsBuffer.addProjectionMetrics = (metrics) => {
        const { layoutProjection } = newStatsBuffer.value;
        layoutProjection.nodes.push(metrics.nodes);
        layoutProjection.calculatedTargetDeltas.push(metrics.calculatedTargetDeltas);
        layoutProjection.calculatedProjections.push(metrics.calculatedProjections);
    };
    Frame.postRender(Record, true);
    return ReportStats;
}
//# sourceMappingURL=index.js.map