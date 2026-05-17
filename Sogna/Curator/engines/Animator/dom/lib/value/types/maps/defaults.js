import { Color } from "../color";
import { Filter } from "../complex/filter.js";
import { Mask } from "../complex/mask.js";
import { NumberValueTypes } from "./number.js";
/**
 * A map of default value types for common values
 */
export const DefaultValueTypes = {
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
};
/**
 * Gets the default ValueType for the provided value key
 */
export const GetDefaultValueType = (key) => DefaultValueTypes[key];
//# sourceMappingURL=defaults.js.map