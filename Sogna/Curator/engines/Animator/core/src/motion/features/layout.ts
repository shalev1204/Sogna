import { HTMLProjectionNode } from "sognaflow-dom"
import { MeasureLayout } from "./layout/measurelayout.js"
import { FeaturePackages } from "./types.js"

export const layout: FeaturePackages = {
    layout: {
        ProjectionNode: HTMLProjectionNode,
        MeasureLayout,
    },
}
