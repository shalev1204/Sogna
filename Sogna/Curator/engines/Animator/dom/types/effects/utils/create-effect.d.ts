import { SognaflowValue } from "../../value";
import { SognaflowValueState } from "../SognaflowValueState.js";
export declare function createEffect<Subject extends object>(addValue: (subject: Subject, state: SognaflowValueState, key: string, value: SognaflowValue) => VoidFunction): (subject: Subject, values: Record<string, SognaflowValue>) => VoidFunction;
