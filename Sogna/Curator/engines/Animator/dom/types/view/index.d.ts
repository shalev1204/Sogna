import type { GroupAnimation } from "../animation/GroupAnimation.js";
import { AnimationOptions, DOMKeyframesDefinition } from "../animation/types.js";
import { ViewTransitionOptions, ViewTransitionTarget, ViewTransitionTargetDefinition } from "./types.js";
import "./types.global.js";
export declare class ViewTransitionBuilder {
    private currentSubject;
    targets: Map<ViewTransitionTargetDefinition, ViewTransitionTarget>;
    update: () => void | Promise<void>;
    options: ViewTransitionOptions;
    notifyReady: (value: GroupAnimation) => void;
    private readyPromise;
    constructor(update: () => void | Promise<void>, options?: ViewTransitionOptions);
    get(subject: ViewTransitionTargetDefinition): this;
    layout(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): this;
    new(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): this;
    old(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): this;
    enter(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): this;
    exit(keyframes: DOMKeyframesDefinition, options?: AnimationOptions): this;
    crossfade(options?: AnimationOptions): this;
    updateTarget(target: "enter" | "exit" | "layout" | "new" | "old", keyframes: DOMKeyframesDefinition, options?: AnimationOptions): void;
    then(resolve: () => void, reject?: () => void): Promise<void>;
}
export declare function AnimateView(update: () => void | Promise<void>, defaultOptions?: ViewTransitionOptions): ViewTransitionBuilder;
