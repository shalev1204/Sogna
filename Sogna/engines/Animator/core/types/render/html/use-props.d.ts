import { AnyResolvedKeyframe, sognaflowValue } from "sognaflow-dom";
import { HTMLProps } from "react";
import { sognaflowProps } from "../../motion/types";
import { ResolvedValues } from "../types.js";
export declare function copyRawValuesOnly(target: ResolvedValues, source: {
    [key: string]: AnyResolvedKeyframe | sognaflowValue;
}, props: sognaflowProps): void;
export declare function useHTMLProps(props: sognaflowProps & HTMLProps<HTMLElement>, visualState: ResolvedValues): any;
