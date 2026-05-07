import { AnimationPlaybackControlsWithThen, AnyResolvedKeyframe, DOMValueAnimationOptions, TimelineWithFallback } from "./types.js";
import { WithPromise } from "./utils/WithPromise.js";
export interface NativeAnimationOptions<V extends AnyResolvedKeyframe = number> extends DOMValueAnimationOptions<V> {
    pseudoElement?: string;
    startTime?: number;
}
/**
 * NativeAnimation implements AnimationPlaybackControls for the browser's Web Animations API.
 */
export declare class NativeAnimation<T extends AnyResolvedKeyframe> extends WithPromise implements AnimationPlaybackControlsWithThen {
    /**
     * The interfaced Web Animation API animation
     */
    protected animation: Animation;
    protected finishedTime: number | null;
    protected options: NativeAnimationOptions;
    private allowFlatten;
    private isStopped;
    private isPseudoElement;
    /**
     * Tracks a manually-set start time that takes precedence over WAAPI's
     * dynamic startTime. This is cleared when play() or time setter is called,
     * allowing WAAPI to take over timing.
     */
    protected manualStartTime: number | null;
    constructor(options?: NativeAnimationOptions);
    updateSognaflowValue?(value?: T): void;
    play(): void;
    pause(): void;
    complete(): void;
    cancel(): void;
    stop(): void;
    /**
     * WAAPI doesn't natively have any interruption capabilities.
     *
     * In this method, we commit styles back to the DOM before cancelling
     * the animation.
     *
     * This is designed to be overridden by NativeAnimationExtended, which
     * will create a renderless JS animation and sample it twice to calculate
     * its current value, "previous" value, and therefore allow
     * sognaflow to also correctly calculate velocity for any subsequent animation
     * while deferring the commit until the next animation frame.
     */
    protected commitStyles(): void;
    get duration(): number;
    get iterationDuration(): number;
    get time(): number;
    set time(newTime: number);
    /**
     * The playback speed of the animation.
     * 1 = normal speed, 2 = double speed, 0.5 = half speed.
     */
    get speed(): number;
    set speed(newSpeed: number);
    get state(): AnimationPlayState;
    get startTime(): number;
    set startTime(newStartTime: number);
    /**
     * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
     */
    attachTimeline({ timeline, rangeStart, rangeEnd, observe, }: TimelineWithFallback): VoidFunction;
}
