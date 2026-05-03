import { IsSognaflowValue } from "../utils/is-sognaflow-value"
import type { WillChange } from "./types"

export function IsWillChangeSognaflowValue(value: any): value is WillChange {
    return Boolean(IsSognaflowValue(value) && (value as any).add)
}

