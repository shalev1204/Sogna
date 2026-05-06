import { ValueTypeMap } from "./types.js";
/**
 * A map of default value types for common values
 */
export declare const DefaultValueTypes: ValueTypeMap;
/**
 * Gets the default ValueType for the provided value key
 */
export declare const GetDefaultValueType: (key: string) => import("../types.js").ValueType;
