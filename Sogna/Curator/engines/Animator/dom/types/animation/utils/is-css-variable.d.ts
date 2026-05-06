import { AnyResolvedKeyframe } from "../types.js";
export type CSSVariableName = `--${string}`;
export type CSSVariableToken = `var(${CSSVariableName})`;
export declare const IsCSSVariableName: (key?: AnyResolvedKeyframe | null) => key is `--${string}`;
export declare const IsCSSVariableToken: (value?: string) => value is CSSVariableToken;
/**
 * Check if a value contains a CSS variable anywhere (e.g. inside calc()).
 * Unlike isCSSVariableToken which checks if the value IS a var() token,
 * this checks if the value CONTAINS var() somewhere in the string.
 */
export declare function ContainsCSSVariable(value?: AnyResolvedKeyframe | null): boolean;
