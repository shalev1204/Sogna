import { SognaflowValue } from "../../value";
import { AnyResolvedKeyframe } from "../types.js";
import { WithRender } from "./types.js";
export type UnresolvedKeyframes<T extends AnyResolvedKeyframe> = Array<T | null>;
export type ResolvedKeyframes<T extends AnyResolvedKeyframe> = Array<T>;
export declare function flushKeyframeResolvers(): void;
export type OnKeyframesResolved<T extends AnyResolvedKeyframe> = (resolvedKeyframes: ResolvedKeyframes<T>, finalKeyframe: T, forced: boolean) => void;
export declare class KeyframeResolver<T extends AnyResolvedKeyframe = any> {
    name?: string;
    element?: WithRender;
    finalKeyframe?: T;
    suspendedScrollY?: number;
    protected unresolvedKeyframes: UnresolvedKeyframes<AnyResolvedKeyframe>;
    private sognaflowValue?;
    private onComplete;
    state: "pending" | "scheduled" | "complete";
    /**
     * Track whether this resolver is async. If it is, it'll be added to the
     * resolver queue and flushed in the next frame. Resolvers that aren't going
     * to trigger read/write thrashing don't need to be async.
     */
    private isAsync;
    /**
     * Track whether this resolver needs to perform a measurement
     * to resolve its keyframes.
     */
    needsMeasurement: boolean;
    constructor(unresolvedKeyframes: UnresolvedKeyframes<AnyResolvedKeyframe>, onComplete: OnKeyframesResolved<T>, name?: string, sognaflowValue?: SognaflowValue<T>, element?: WithRender, isAsync?: boolean);
    scheduleResolve(): void;
    readKeyframes(): void;
    setFinalKeyframe(): void;
    measureInitialState(): void;
    renderEndStyles(): void;
    measureEndState(): void;
    complete(isForcedComplete?: boolean): void;
    cancel(): void;
    resume(): void;
}
