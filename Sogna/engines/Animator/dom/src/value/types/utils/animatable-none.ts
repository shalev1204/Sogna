import { Complex } from "../complex"
import { Filter } from "../complex/filter.js"
import { Mask } from "../complex/mask.js"
import { GetDefaultValueType } from "../maps/defaults.js"

const customTypes = /*@__PURE__*/ new Set([Filter, Mask])

export function GetAnimatableNone(key: string, value: string) {
    let defaultValueType = GetDefaultValueType(key)
    if (!customTypes.has(defaultValueType as any)) defaultValueType = Complex
    // If value is not recognised as animatable, ie "none", create an animatable version origin based on the target
    return defaultValueType.getAnimatableNone
        ? defaultValueType.getAnimatableNone(value)
        : undefined
}
