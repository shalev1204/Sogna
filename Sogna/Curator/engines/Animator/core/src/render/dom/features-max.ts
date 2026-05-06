"use client"

import { drag } from "../../sognaflow/features/drag"
import { layout } from "../../sognaflow/features/layout"
import { FeatureBundle } from "../../sognaflow/features/types"
import { domAnimation } from "./features-animation.js"

/**
 * @public
 */
export const domMax: FeatureBundle = {
    ...domAnimation,
    ...drag,
    ...layout,
}
