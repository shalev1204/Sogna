import { HSLA, RGBA } from "../types"
import { Hex } from "./hex"
import { Hsla } from "./hsla"
import { Rgba } from "./rgba"

export const Color = {
    test: (v: any) => Rgba.test(v) || Hex.test(v) || Hsla.test(v),
    parse: (v: any): RGBA | HSLA => {
        if (Rgba.test(v)) {
            return Rgba.parse(v)
        } else if (Hsla.test(v)) {
            return Hsla.parse(v)
        } else {
            return Hex.parse(v)
        }
    },
    transform: (v: HSLA | RGBA | string) => {
        return typeof v === "string"
            ? v
            : v.hasOwnProperty("red")
            ? Rgba.transform(v as RGBA)
            : Hsla.transform(v as HSLA)
    },
    getAnimatableNone: (v: string) => {
        const parsed = Color.parse(v)
        parsed.alpha = 0
        return Color.transform(parsed)
    },
}
