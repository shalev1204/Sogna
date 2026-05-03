import { Color } from "../color"
import { Filter } from "../complex/filter"
import { Mask } from "../complex/mask"
import { NumberValueTypes } from "./number"
import { ValueTypeMap } from "./types"

/**
 * A map of default value types for common values
 */
export const DefaultValueTypes: ValueTypeMap = {
    ...NumberValueTypes,

    // Color props
    color: Color,
    backgroundColor: Color,
    outlineColor: Color,
    fill: Color,
    stroke: Color,

    // Border props
    borderColor: Color,
    borderTopColor: Color,
    borderRightColor: Color,
    borderBottomColor: Color,
    borderLeftColor: Color,
    filter: Filter,
    WebkitFilter: Filter,
    mask: Mask,
    WebkitMask: Mask,
}

/**
 * Gets the default ValueType for the provided value key
 */
export const GetDefaultValueType = (key: string) => DefaultValueTypes[key]
