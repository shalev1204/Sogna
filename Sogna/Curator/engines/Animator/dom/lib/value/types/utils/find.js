import { Color } from "../color";
import { Complex } from "../complex";
import { DimensionValueTypes } from "../dimensions";
import { TestValueType } from "../test";
/**
 * A list of all ValueTypes
 */
const valueTypes = [...DimensionValueTypes, Color, Complex];
/**
 * Tests a value against the list of ValueTypes
 */
export const FindValueType = (v) => valueTypes.find(TestValueType(v));
//# sourceMappingURL=find.js.map