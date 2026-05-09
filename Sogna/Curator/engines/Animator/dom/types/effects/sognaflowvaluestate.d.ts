import { AnyResolvedKeyframe } from "../animation/types.js";
import { SognaflowValue } from "../value";
export declare class SognaflowValueState {
    latest: {
[name: string]: AnyResolvedKeyframe;
    };
    private values;
set(name: string, value: SognaflowValue, render?: VoidFunction, computed?: SognaflowValue, useDefaultValueType?: boolean): () => void;
get(name: string): SognaflowValue | undefined;
}
