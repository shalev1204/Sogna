import { ValueType } from "./types.js"

/**
 * ValueType for "auto"
 */
export const Auto: ValueType = {
    test: (v: any) => v === "auto",
    parse: (v) => v,
}
