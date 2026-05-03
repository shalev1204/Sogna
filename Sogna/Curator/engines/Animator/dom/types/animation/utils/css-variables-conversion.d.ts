import { AnyResolvedKeyframe } from "../types";
import { CSSVariableToken } from "./is-css-variable";
export declare function ParseCSSVariable(current: string): string[] | undefined[];
export declare function GetVariableValue(current: CSSVariableToken, element: Element, depth?: number): AnyResolvedKeyframe | undefined;
