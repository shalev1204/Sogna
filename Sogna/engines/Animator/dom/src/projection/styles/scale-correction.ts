import { IsCSSVariableName } from "../../animation/utils/is-css-variable.js"
import { correctBorderRadius } from "./scale-border-radius.js"
import { correctBoxShadow } from "./scale-box-shadow.js"
import type { ScaleCorrectorMap } from "./types.js"

export const scaleCorrectors: ScaleCorrectorMap = {
    borderRadius: {
        ...correctBorderRadius,
        applyTo: [
            "borderTopLeftRadius",
            "borderTopRightRadius",
            "borderBottomLeftRadius",
            "borderBottomRightRadius",
        ],
    },
    borderTopLeftRadius: correctBorderRadius,
    borderTopRightRadius: correctBorderRadius,
    borderBottomLeftRadius: correctBorderRadius,
    borderBottomRightRadius: correctBorderRadius,
    boxShadow: correctBoxShadow,
}

export function addScaleCorrector(correctors: ScaleCorrectorMap) {
    for (const key in correctors) {
        scaleCorrectors[key] = correctors[key]
        if (IsCSSVariableName(key)) {
            scaleCorrectors[key].isCSSVariable = true
        }
    }
}
