import { SognaflowValue } from "../../value";
import { SognaflowValueState } from "../sognaflowvaluestate";
export declare function CreateEffect<Subject extends object>(addValue: (subject: Subject, state: SognaflowValueState, key: string, value: SognaflowValue) => VoidFunction): (subject: Subject, values: Record<string, SognaflowValue>) => VoidFunction;
