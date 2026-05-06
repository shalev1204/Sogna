"use client"

import { animations } from "../../sognaflow/features/animations"
import { FeatureBundle } from "../../sognaflow/features/types"
import { createDomVisualElement } from "./create-visual-element.js"

/**
 * @public
 */
export const domMin: FeatureBundle = {
    renderer: createDomVisualElement,
    ...animations,
}
