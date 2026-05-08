import { DragGesture } from "../../gestures/drag"
import { PanGesture } from "../../gestures/pan"
import { HTMLProjectionNode } from "../../projection.js"
import { MeasureLayout } from "./layout/measurelayout.js"
import { FeaturePackages } from "./types.js"

export const drag: FeaturePackages = {
    pan: {
        Feature: PanGesture,
    },
    drag: {
        Feature: DragGesture,
        ProjectionNode: HTMLProjectionNode,
        MeasureLayout,
    },
}
