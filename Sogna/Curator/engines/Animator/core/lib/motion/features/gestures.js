import { HoverGesture } from "../../gestures/hover.js";
import { FocusGesture } from "../../gestures/focus.js";
import { PressGesture } from "../../gestures/press.js";
import { InViewFeature } from "./viewport";
export const gestureAnimations = {
    inView: {
        Feature: InViewFeature,
    },
    tap: {
        Feature: PressGesture,
    },
    focus: {
        Feature: FocusGesture,
    },
    hover: {
        Feature: HoverGesture,
    },
};
//# sourceMappingURL=gestures.js.map
