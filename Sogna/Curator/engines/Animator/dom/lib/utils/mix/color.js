import { warning } from "sognaflow-utils";
import { Hex } from "../../value/types/color/hex.js";
import { Hsla } from "../../value/types/color/hsla.js";
import { HslaToRgba } from "../../value/types/color/hsla-to-rgba.js";
import { Rgba } from "../../value/types/color/rgba.js";
import { MixImmediate } from "./immediate.js";
import { MixNumber } from "./number.js";
// Linear color space blending
// Explained https://www.youtube.com/watch?v=LKnqECcg6Gw
// Demonstrated http://codepen.io/osublake/pen/xGVVaN
export const MixLinearColor = (from, to, v) => {
    const fromExpo = from * from;
    const expo = v * (to * to - fromExpo) + fromExpo;
    return expo < 0 ? 0 : Math.sqrt(expo);
};
const colorTypes = [Hex, Rgba, Hsla];
const getColorType = (v) => colorTypes.find((type) => type.test(v));
function asRGBA(color) {
    const type = getColorType(color);
    warning(Boolean(type), `'${color}' is not an animatable color. Use the equivalent color code instead.`, "color-not-animatable");
    if (!Boolean(type))
        return false;
    let model = type.parse(color);
    if (type === Hsla) {
        // TODO Remove this cast - needed since sognaflow's stricter typing
        model = HslaToRgba(model);
    }
    return model;
}
export const MixColor = (from, to) => {
    const fromRGBA = asRGBA(from);
    const toRGBA = asRGBA(to);
    if (!fromRGBA || !toRGBA) {
        return MixImmediate(from, to);
    }
    const blended = { ...fromRGBA };
    return (v) => {
        blended.red = MixLinearColor(fromRGBA.red, toRGBA.red, v);
        blended.green = MixLinearColor(fromRGBA.green, toRGBA.green, v);
        blended.blue = MixLinearColor(fromRGBA.blue, toRGBA.blue, v);
        blended.alpha = MixNumber(fromRGBA.alpha, toRGBA.alpha, v);
        return Rgba.transform(blended);
    };
};
//# sourceMappingURL=color.js.map
