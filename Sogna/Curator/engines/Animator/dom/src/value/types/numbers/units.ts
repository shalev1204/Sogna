import { AnyResolvedKeyframe } from "../../../animation/types"

/*#__NO_SIDE_EFFECTS__*/
const CreateUnitType = (unit: string) => ({
    test: (v: AnyResolvedKeyframe) =>
        typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1,
    parse: parseFloat,
    transform: (v: number | string) => `${v}${unit}`,
})

export const Degrees = /*@__PURE__*/ CreateUnitType("deg")
export const Percent = /*@__PURE__*/ CreateUnitType("%")
export const Px = /*@__PURE__*/ CreateUnitType("px")
export const Vh = /*@__PURE__*/ CreateUnitType("vh")
export const Vw = /*@__PURE__*/ CreateUnitType("vw")

export const ProgressPercentage = /*@__PURE__*/ (() => ({
    ...Percent,
    parse: (v: string) => Percent.parse(v) / 100,
    transform: (v: number) => Percent.transform(v * 100),
}))()
