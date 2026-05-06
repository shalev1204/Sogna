import { inertia } from "../generators/inertia.js"
import { keyframes } from "../generators/keyframes.js"
import { spring } from "../generators/spring.js"
import { GeneratorFactory, ValueAnimationTransition } from "../types.js"

const transitionTypeMap: { [key: string]: GeneratorFactory } = {
    decay: inertia,
    inertia,
    tween: keyframes,
    keyframes: keyframes,
    spring,
}

export function replaceTransitionType(transition: ValueAnimationTransition) {
    if (typeof transition.type === "string") {
        transition.type = transitionTypeMap[transition.type]
    }
}
