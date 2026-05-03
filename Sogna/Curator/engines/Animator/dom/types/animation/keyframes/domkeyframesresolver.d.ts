import { SognaflowValue } from "../../value";
import { AnyResolvedKeyframe } from "../types";
import { KeyframeResolver, OnKeyframesResolved, UnresolvedKeyframes } from "./keyframesresolver";
import { WithRender } from "./types";
export declare class DOMKeyframesResolver<T extends AnyResolvedKeyframe> extends KeyframeResolver<T> {
    name: string;
    element?: WithRender;
    private removedTransforms?;
    private measuredOrigin?;
    constructor(unresolvedKeyframes: UnresolvedKeyframes<AnyResolvedKeyframe>, onComplete: OnKeyframesResolved<T>, name?: string, sognaflowValue?: SognaflowValue<T>, element?: WithRender);
    readKeyframes(): void;
    resolveNoneKeyframes(): void;
    measureInitialState(): void;
    measureEndState(): void;
}
