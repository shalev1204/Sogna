import { DragGesture } from "../../gestures/drag";
import { PanGesture } from "../../gestures/pan";
import { HTMLProjectionNode } from "../../projection.js";
import { MeasureLayout } from "./layout/MeasureLayout.js";
export const drag = {
    pan: {
        Feature: PanGesture,
    },
    drag: {
        Feature: DragGesture,
        ProjectionNode: HTMLProjectionNode,
        MeasureLayout,
    },
};
//# sourceMappingURL=drag.js.map