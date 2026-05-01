import type { AnyResolvedKeyframe } from "../../animation/types"
import { issognaflowValue } from "./is-sognaflow-value"
import type { sognaflowValue } from "../index"

/**
 * If the provided value is a sognaflowValue, this returns the actual value, otherwise just the value itself
 */
export function resolvesognaflowValue(
    value?: AnyResolvedKeyframe | sognaflowValue
): AnyResolvedKeyframe {
    return issognaflowValue(value) ? value.get() : value
}
