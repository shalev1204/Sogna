import { Hex } from "./hex";
import { Hsla } from "./hsla";
import { Rgba } from "./rgba";
export const Color = {
    test: (v) => Rgba.test(v) || Hex.test(v) || Hsla.test(v),
    parse: (v) => {
        if (Rgba.test(v)) {
            return Rgba.parse(v);
        }
        else if (Hsla.test(v)) {
            return Hsla.parse(v);
        }
        else {
            return Hex.parse(v);
        }
    },
    transform: (v) => {
        return typeof v === "string"
            ? v
            : v.hasOwnProperty("red")
                ? Rgba.transform(v)
                : Hsla.transform(v);
    },
    getAnimatableNone: (v) => {
        const parsed = Color.parse(v);
        parsed.alpha = 0;
        return Color.transform(parsed);
    },
};
//# sourceMappingURL=index.js.map