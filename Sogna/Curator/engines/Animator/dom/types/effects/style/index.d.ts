import { SognaflowValue } from "../../value";
import { SognaflowValueState } from "../SognaflowValueState.js";
export declare const AddStyleValue: (element: HTMLElement | SVGElement, state: SognaflowValueState, key: string, value: SognaflowValue) => () => void;
export declare const StyleEffect: (subject: import("../../index.js").ElementOrSelector, values: Record<string, SognaflowValue>) => () => void;
