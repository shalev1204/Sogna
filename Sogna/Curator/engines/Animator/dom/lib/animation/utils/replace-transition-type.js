import { inertia } from "../generators/inertia";
import { keyframes } from "../generators/keyframes";
import { spring } from "../generators/spring";
const transitionTypeMap = {
    decay: inertia,
    inertia,
    tween: keyframes,
    keyframes: keyframes,
    spring,
};
export function replaceTransitionType(transition) {
    if (typeof transition.type === "string") {
        transition.type = transitionTypeMap[transition.type];
    }
}
//# sourceMappingURL=replace-transition-type.js.map