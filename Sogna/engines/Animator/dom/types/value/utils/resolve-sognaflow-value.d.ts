import type { AnyResolvedKeyframe } from "../../animation/types.js";
import type { SognaflowValue } from "../index.js";
/**
 * If the provided value is a sognaflowValue, this returns the actual value, otherwise just the value itself
 */
export declare function ResolveSognaflowValue<T extends AnyResolvedKeyframe>(value?: T | SognaflowValue<T>): T | undefined;
export declare const resolvesognaflowValue: typeof ResolveSognaflowValue;
