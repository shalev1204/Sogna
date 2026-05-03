import { animations } from "../../../sognaflow/features/animations"
import { drag } from "../../../sognaflow/features/drag"
import { gestureAnimations } from "../../../sognaflow/features/gestures"
import { layout } from "../../../sognaflow/features/layout"

export const featureBundle = {
    ...animations,
    ...gestureAnimations,
    ...drag,
    ...layout,
}
