import { IsSognaflowValue } from "./is-sognaflow-value.js";
/**
 * If the provided value is a sognaflowValue, this returns the actual value, otherwise just the value itself
 */
export function ResolveSognaflowValue(value) {
    return IsSognaflowValue(value) ? value.get() : value;
}
//# sourceMappingURL=resolve-sognaflow-value.js.map