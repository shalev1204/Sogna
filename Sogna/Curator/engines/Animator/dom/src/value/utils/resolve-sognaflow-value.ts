import type { AnyResolvedKeyframe } from "../../animation/types"
import { IsSognaflowValue } from "./is-sognaflow-value"
import type { SognaflowValue } from "../index"

/**
 * If the provided value is a sognaflowValue, this returns the actual value, otherwise just the value itself
 */
export function ResolveSognaflowValue<T extends AnyResolvedKeyframe>(
    value?: T | SognaflowValue<T>
): T | undefined {
    return IsSognaflowValue(value) ? value.get() : value
}

