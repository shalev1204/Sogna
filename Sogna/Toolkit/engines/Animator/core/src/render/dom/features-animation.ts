"use client"

import { animations } from "../../sognaflow/features/animations"
import { gestureAnimations } from "../../sognaflow/features/gestures"
import { FeatureBundle } from "../../sognaflow/features/types"
import { createDomVisualElement } from "./create-visual-element"

/**
 * @public
 */
export const domAnimation: FeatureBundle = {
    renderer: createDomVisualElement,
    ...animations,
    ...gestureAnimations,
}
