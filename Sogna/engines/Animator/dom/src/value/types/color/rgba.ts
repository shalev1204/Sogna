import { clamp } from "sognaflow-utils"
import { Alpha as alphaType, NumberType } from "../numbers"
import { RGBA } from "../types.js"
import { sanitize } from "../utils/sanitize.js"
import { isColorString, splitColor } from "./utils.js"

const clampRgbUnit = (v: number) => clamp(0, 255, v)
export const RgbUnit = {
    ...NumberType,
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

export const rgba = Rgba
export const rgbUnit = RgbUnit

