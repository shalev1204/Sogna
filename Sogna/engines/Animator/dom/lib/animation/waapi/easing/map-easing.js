import { isBezierDefinition } from "sognaflow-utils";
import { supportsLinearEasing } from "../../../utils/supports/linear-easing.js";
import { generateLinearEasing } from "../utils/linear.js";
import { cubicBezierAsString } from "./cubic-bezier.js";
import { supportedWaapiEasing } from "./supported.js";
export function mapEasingToNativeEasing(easing, duration) {
    if (!easing) {
        return undefined;
    }
    else if (typeof easing === "function") {
        return supportsLinearEasing()
            ? generateLinearEasing(easing, duration)
            : "ease-out";
    }
    else if (isBezierDefinition(easing)) {
        return cubicBezierAsString(easing);
    }
    else if (Array.isArray(easing)) {
        return easing.map((segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) ||
            supportedWaapiEasing.easeOut);
    }
    else {
        return supportedWaapiEasing[easing];
    }
}
//# sourceMappingURL=map-easing.js.map