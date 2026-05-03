import { HTMLProjectionNode } from "sognaflow-dom"
import { MeasureLayout } from "./layout/measurelayout"
import { FeaturePackages } from "./types"

export const layout: FeaturePackages = {
    layout: {
        ProjectionNode: HTMLProjectionNode,
        MeasureLayout,
    },
}
