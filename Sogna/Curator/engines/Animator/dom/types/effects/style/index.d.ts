import { SognaflowValue } from "../../value";
import { SognaflowValueState } from "../sognaflowvaluestate";
export declare const AddStyleValue: (element: HTMLElement | SVGElement, state: SognaflowValueState, key: string, value: SognaflowValue) => () => void;
export declare const StyleEffect: (subject: import("../..").ElementOrSelector, values: Record<string, SognaflowValue>) => () => void;
