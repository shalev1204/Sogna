import { ValueType } from "./types"

/**
 * Tests a provided value against a ValueType
 */
export const TestValueType = (v: any) => (type: ValueType) => type.test(v)
