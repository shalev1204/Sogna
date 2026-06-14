import { AnyResolvedKeyframe } from "../types.js";
import { CSSVariableToken } from "./is-css-variable.js";
export declare function ParseCSSVariable(current: string): string[] | undefined[];
export declare function GetVariableValue(current: CSSVariableToken, element: Element, depth?: number): AnyResolvedKeyframe | undefined;
