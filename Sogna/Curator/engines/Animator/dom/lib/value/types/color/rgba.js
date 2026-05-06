import { clamp } from "sognaflow-utils";
import { Alpha as AlphaType, NumberType } from "../numbers";
import { sanitize } from "../utils/sanitize.js";
import { isColorString, splitColor } from "./utils.js";
const clampRgbUnit = (v) => clamp(0, 255, v);
export const RgbUnit = {
    ...NumberType,
    transform: (v) => Math.round(clampRgbUnit(v)),
};
export const Rgba = {
    test: /*@__PURE__*/ isColorString("rgb", "red"),
    parse: /*@__PURE__*/ splitColor("red", "green", "blue"),
    transform: ({ red, green, blue, alpha = 1 }) => "rgba(" +
        RgbUnit.transform(red) +
        ", " +
        RgbUnit.transform(green) +
        ", " +
        RgbUnit.transform(blue) +
        ", " +
        sanitize(AlphaType.transform(alpha)) +
        ")",
};
//# sourceMappingURL=rgba.js.map