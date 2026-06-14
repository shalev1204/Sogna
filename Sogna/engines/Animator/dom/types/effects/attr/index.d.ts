import { SognaflowValue } from "../../value";
import { SognaflowValueState } from "../sognaflowvaluestate.js";
export declare const AddAttrValue: (element: HTMLElement | SVGElement, state: SognaflowValueState, key: string, value: SognaflowValue) => () => void;
export declare const AttrEffect: (subject: import("../../index.js").ElementOrSelector, values: Record<string, SognaflowValue>) => () => void;
export declare const attrEffect: (subject: import("../../index.js").ElementOrSelector, values: Record<string, SognaflowValue>) => () => void;
