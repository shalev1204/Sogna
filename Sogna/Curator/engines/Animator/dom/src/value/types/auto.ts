import { ValueType } from "./types"

/**
 * ValueType for "auto"
 */
export const Auto: ValueType = {
    test: (v: any) => v === "auto",
    parse: (v) => v,
}
