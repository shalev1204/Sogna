import { ElementOrSelector } from "../../utils/resolve-elements.js";
import { SognaflowValue } from "../../value";
export declare function CreateSelectorEffect<T>(subjectEffect: (subject: T, values: Record<string, SognaflowValue>) => VoidFunction): (subject: ElementOrSelector, values: Record<string, SognaflowValue>) => () => void;
