import { Alpha as AlphaType } from "../numbers";
import { Percent } from "../numbers/units";
import { sanitize } from "../utils/sanitize";
import { isColorString, splitColor } from "./utils";
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
            sanitize(AlphaType.transform(alpha)) +
            ")");
    },
};
//# sourceMappingURL=hsla.js.map