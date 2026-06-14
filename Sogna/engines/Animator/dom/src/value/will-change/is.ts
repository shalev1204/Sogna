import { IsSognaflowValue } from "../utils/is-sognaflow-value.js"
import type { WillChange } from "./types.js"

export function IsWillChangeSognaflowValue(value: any): value is WillChange {
    return Boolean(IsSognaflowValue(value) && (value as any).add)
}

