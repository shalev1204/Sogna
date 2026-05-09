import { Auto } from "./auto.js";
import { NumberType } from "./numbers";
import { Degrees, Percent, Px, Vh, Vw } from "./numbers/units.js";
import { TestValueType } from "./test.js";
/**
 * A list of value types commonly used for dimensions
 */
export const DimensionValueTypes = [
    NumberType,
    Px,
    Percent,
    Degrees,
    Vw,
    Vh,
    Auto,
];
/**
 * Tests a dimensional value against the list of dimension ValueTypes
 */
export const FindDimensionValueType = (v) => DimensionValueTypes.find(TestValueType(v));
//# sourceMappingURL=dimensions.js.map
