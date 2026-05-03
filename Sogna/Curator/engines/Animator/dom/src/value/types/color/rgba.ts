import { clamp } from "sognaflow-utils"
import { alpha as alphaType, number } from "../numbers"
import { RGBA } from "../types"
import { sanitize } from "../utils/sanitize"
import { isColorString, splitColor } from "./utils"

const clampRgbUnit = (v: number) => clamp(0, 255, v)
export const RgbUnit = {
    ...number,
    transform: (v: number) => Math.round(clampRgbUnit(v)),
}

export const Rgba = {
    test: /*@__PURE__*/ isColorString("rgb", "red"),
    parse: /*@__PURE__*/ splitColor<RGBA>("red", "green", "blue"),
    transform: ({ red, green, blue, alpha = 1 }: RGBA) =>
        "rgba(" +
        RgbUnit.transform(red) +
        ", " +
        RgbUnit.transform(green) +
        ", " +
        RgbUnit.transform(blue) +
        ", " +
        sanitize(alphaType.transform(alpha)) +
        ")",
}
