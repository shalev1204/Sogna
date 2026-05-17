import { anticipate, backInOut, circInOut } from "sognaflow-utils";
const unsupportedEasingFunctions = {
    anticipate,
    backInOut,
    circInOut,
};
function isUnsupportedEase(key) {
    return key in unsupportedEasingFunctions;
}
export function replaceStringEasing(transition) {
    if (typeof transition.ease === "string" &&
        isUnsupportedEase(transition.ease)) {
        transition.ease = unsupportedEasingFunctions[transition.ease];
    }
}
//# sourceMappingURL=unsupported-easing.js.map