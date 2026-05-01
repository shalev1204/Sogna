import { issognaflowValue } from "../utils/is-sognaflow-value"
import type { WillChange } from "./types"

export function isWillChangesognaflowValue(value: any): value is WillChange {
    return Boolean(issognaflowValue(value) && (value as WillChange).add)
}
