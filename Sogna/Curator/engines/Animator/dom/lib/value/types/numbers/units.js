/*#__NO_SIDE_EFFECTS__*/
const CreateUnitType = (unit) => ({
    test: (v) => typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1,
    parse: parseFloat,
    transform: (v) => `${v}${unit}`,
});
export const Degrees = /*@__PURE__*/ CreateUnitType("deg");
export const Percent = /*@__PURE__*/ CreateUnitType("%");
export const Px = /*@__PURE__*/ CreateUnitType("px");
export const Vh = /*@__PURE__*/ CreateUnitType("vh");
export const Vw = /*@__PURE__*/ CreateUnitType("vw");
export const ProgressPercentage = /*@__PURE__*/ (() => ({
    ...Percent,
    parse: (v) => Percent.parse(v) / 100,
    transform: (v) => Percent.transform(v * 100),
}))();
//# sourceMappingURL=units.js.map
