import { ResolvedKeyframes } from "./keyframes/KeyframesResolver.js";
import { AnimationPlaybackControls, AnyResolvedKeyframe, TimelineWithFallback, ValueAnimationOptions } from "./types.js";
import { WithPromise } from "./utils/WithPromise.js";
type OptionsWithoutKeyframes<T extends AnyResolvedKeyframe> = Omit<ValueAnimationOptions<T>, "keyframes">;
export declare class AsyncSognaflowValueAnimation<T extends AnyResolvedKeyframe> extends WithPromise implements AnimationPlaybackControls {
    private createdAt;
    private resolvedAt;
    private _animation;
    private pendingTimeline;
    private keyframeResolver;
    private stopTimeline;
    constructor({ autoplay, delay, type, repeat, repeatDelay, repeatType, keyframes, name, sognaflowValue, element, ...options }: ValueAnimationOptions<T>);
    onKeyframesResolved(keyframes: ResolvedKeyframes<T>, finalKeyframe: T, options: OptionsWithoutKeyframes<T>, sync: boolean): void;
    get finished(): Promise<any>;
    then(onResolve: VoidFunction, _onReject?: VoidFunction): Promise<void>;
    get animation(): AnimationPlaybackControls;
    get duration(): number;
    get iterationDuration(): number;
    get time(): number;
    set time(newTime: number);
    get speed(): number;
    get state(): AnimationPlayState;
    set speed(newSpeed: number);
    get startTime(): number | null;
    attachTimeline(timeline: TimelineWithFallback): () => void;
    play(): void;
    pause(): void;
    complete(): void;
    cancel(): void;
    /**
     * Bound to support return animation.stop pattern
     */
    stop: () => void;
}
export {};
