import { Color } from "../color"
import { Complex } from "../complex"
import { DimensionValueTypes } from "../dimensions.js"
import { TestValueType } from "../test.js"

/**
 * A list of all ValueTypes
 */
const valueTypes = [...DimensionValueTypes, Color, Complex]

/**
 * Tests a value against the list of ValueTypes
 */
export const FindValueType = (v: any) => valueTypes.find(TestValueType(v))

export const findValueType = FindValueType

