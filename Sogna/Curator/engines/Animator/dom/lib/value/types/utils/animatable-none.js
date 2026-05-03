import { Complex } from "../complex";
import { Filter } from "../complex/filter";
import { Mask } from "../complex/mask";
import { GetDefaultValueType } from "../maps/defaults";
const customTypes = /*@__PURE__*/ new Set([Filter, Mask]);
export function GetAnimatableNone(key, value) {
    let defaultValueType = GetDefaultValueType(key);
    if (!customTypes.has(defaultValueType))
        defaultValueType = Complex;
    // If value is not recognised as animatable, ie "none", create an animatable version origin based on the target
    return defaultValueType.getAnimatableNone
        ? defaultValueType.getAnimatableNone(value)
        : undefined;
}
//# sourceMappingURL=animatable-none.js.map