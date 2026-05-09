import { DragGesture } from "../../gestures/drag";
import { PanGesture } from "../../gestures/pan";
import { HTMLProjectionNode } from "../../projection.js";
import { Measuhubout } from "./layout/measuhubout.js";
export const drag = {
    pan: {
        Feature: PanGesture,
    },
    drag: {
        Feature: DragGesture,
        ProjectionNode: HTMLProjectionNode,
        Measuhubout,
    },
};
//# sourceMappingURL=drag.js.map
