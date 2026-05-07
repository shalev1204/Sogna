import { GroupAnimation } from "../animation/GroupAnimation.js";
import type { AnimationOptions } from "../animation/types.js";
import { type ElementOrSelector } from "../utils/resolve-elements.js";
type LayoutAnimationScope = Element | Document;
type LayoutBuilderResolve = (animation: GroupAnimation) => void;
type LayoutBuilderReject = (error: unknown) => void;
export declare class LayoutAnimationBuilder {
    private scope;
    private updateDom;
    private defaultOptions?;
    private sharedTransitions;
    private notifyReady;
    private rejectReady;
    private readyPromise;
    constructor(scope: LayoutAnimationScope, updateDom: () => void | Promise<void>, defaultOptions?: AnimationOptions);
    shared(id: string, transition: AnimationOptions): this;
    then(resolve: LayoutBuilderResolve, reject?: LayoutBuilderReject): Promise<void>;
    private start;
    private buildRecords;
    private handleExitingElements;
}
export declare function parseAnimateLayoutArgs(scopeOrUpdateDom: ElementOrSelector | (() => void), updateDomOrOptions?: (() => void) | AnimationOptions, options?: AnimationOptions): {
    scope: Element | Document;
    updateDom: () => void;
    defaultOptions?: AnimationOptions;
};
export {};
