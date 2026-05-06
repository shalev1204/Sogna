import type { AnimationType } from "../../render/types.js"
import type { Transition } from "../types.js"

export interface VisualElementAnimationOptions {
    delay?: number
    transitionOverride?: Transition
    custom?: any
    type?: AnimationType
}
