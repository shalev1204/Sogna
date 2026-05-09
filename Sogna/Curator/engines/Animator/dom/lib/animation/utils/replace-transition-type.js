import { inertia } from "../generators/inertia.js";
import { keyframes } from "../generators/keyframes.js";
import { spring } from "../generators/spring.js";
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
