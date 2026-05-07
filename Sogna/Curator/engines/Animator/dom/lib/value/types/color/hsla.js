import { Alpha as alphaType } from "../numbers";
import { Percent } from "../numbers/units.js";
import { sanitize } from "../utils/sanitize.js";
import { isColorString, splitColor } from "./utils.js";
export const Hsla = {
    test: /*@__PURE__*/ isColorString("hsl", "hue"),
    parse: /*@__PURE__*/ splitColor("hue", "saturation", "lightness"),
    transform: ({ hue, saturation, lightness, alpha = 1 }) => {
        return ("hsla(" +
            Math.round(hue) +
            ", " +
            Percent.transform(sanitize(saturation)) +
            ", " +
            Percent.transform(sanitize(lightness)) +
            ", " +
            sanitize(alphaType.transform(alpha)) +
            ")");
    },
};
//# sourceMappingURL=hsla.js.map