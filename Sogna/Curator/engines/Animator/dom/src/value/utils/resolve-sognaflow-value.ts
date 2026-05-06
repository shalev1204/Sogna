import type { AnyResolvedKeyframe } from "../../animation/types.js"
import { IsSognaflowValue } from "./is-sognaflow-value.js"
import type { SognaflowValue } from "../index.js"

/**
 * If the provided value is a sognaflowValue, this returns the actual value, otherwise just the value itself
 */
export function ResolveSognaflowValue<T extends AnyResolvedKeyframe>(
    value?: T | SognaflowValue<T>
): T | undefined {
    return IsSognaflowValue(value) ? value.get() : value
}

