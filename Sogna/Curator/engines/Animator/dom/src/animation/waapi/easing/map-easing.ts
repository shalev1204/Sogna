import { Easing, isBezierDefinition } from "sognaflow-utils"
import { supportsLinearEasing } from "../../../utils/supports/linear-easing.js"
import { generateLinearEasing } from "../utils/linear.js"
import { cubicBezierAsString } from "./cubic-bezier.js"
import { supportedWaapiEasing } from "./supported.js"

export function mapEasingToNativeEasing(
    easing: Easing | Easing[] | undefined,
    duration: number
): undefined | string | string[] {
    if (!easing) {
        return undefined
    } else if (typeof easing === "function") {
        return supportsLinearEasing()
            ? generateLinearEasing(easing, duration)
            : "ease-out"
    } else if (isBezierDefinition(easing)) {
        return cubicBezierAsString(easing)
    } else if (Array.isArray(easing)) {
        return easing.map(
            (segmentEasing) =>
                (mapEasingToNativeEasing(segmentEasing, duration) as string) ||
                supportedWaapiEasing.easeOut
        )
    } else {
        return supportedWaapiEasing[easing as keyof typeof supportedWaapiEasing]
    }
}
