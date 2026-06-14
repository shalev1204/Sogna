import { anticipate, backInOut, circInOut } from "sognaflow-utils"
import { ValueAnimationTransition } from "../../types.js"

const unsupportedEasingFunctions = {
    anticipate,
    backInOut,
    circInOut,
}

function isUnsupportedEase(
    key: string
): key is keyof typeof unsupportedEasingFunctions {
    return key in unsupportedEasingFunctions
}

export function replaceStringEasing(transition: ValueAnimationTransition) {
    if (
        typeof transition.ease === "string" &&
        isUnsupportedEase(transition.ease)
    ) {
        transition.ease = unsupportedEasingFunctions[transition.ease]
    }
}
