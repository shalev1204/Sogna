import { AnimationPlaybackControlsWithThen, AnimationState, TimelineWithFallback, ValueAnimationOptions } from "./types.js";
import { WithPromise } from "./utils/withpromise.js";
export declare class JSAnimation<T extends number | string> extends WithPromise implements AnimationPlaybackControlsWithThen {
    state: AnimationPlayState;
    startTime: number | null;
    /**
     * The driver that's controlling the animation loop. Normally this is a requestAnimationFrame loop
     * but in tests we can pass in a synchronous loop.
     */
    private driver?;
    private isStopped;
    private generator;
    private calculatedDuration;
    private resolvedDuration;
    private totalDuration;
    private options;
    /**
     * The current time of the animation.
     */
    private currentTime;
    /**
     * The time at which the animation was paused.
     */
    private holdTime;
    /**
     * Playback speed as a factor. 0 would be stopped, -1 reverse and 2 double speed.
     */
    private playbackSpeed;
    private mixKeyframes;
    private mirroredGenerator;
    /**
     * Reusable state object for the delay phase to avoid
     * allocating a new object every frame.
     */
    private delayState;
    constructor(options: ValueAnimationOptions<T>);
    initAnimation(): void;
    updateTime(timestamp: number): void;
    tick(timestamp: number, sample?: boolean): AnimationState<T>;
    /**
     * Allows the returned animation to be awaited or promise-chained. Currently
     * resolves when the animation finishes at all but in a future update could/should
     * reject if its cancels.
     */
    then(resolve: VoidFunction, reject?: VoidFunction): Promise<void>;
    get duration(): number;
    get iterationDuration(): number;
    get time(): number;
    set time(newTime: number);
    /**
     * Returns the generator's velocity at the current time in units/second.
     * Uses the analytical derivative when available (springs), avoiding
     * the sognaflowValue's frame-dependent velocity estimation.
     */
    getGeneratorVelocity(): number;
    get speed(): number;
    set speed(newSpeed: number);
    play(): void;
    pause(): void;
    /**
     * This method is bound to the instance to fix a pattern where
     * animation.stop is returned as a reference from a useEffect.
     */
    stop: () => void;
    complete(): void;
    finish(): void;
    cancel(): void;
    private teardown;
    private stopDriver;
    sample(sampleTime: number): AnimationState<T>;
    attachTimeline(timeline: TimelineWithFallback): VoidFunction;
}
export declare function AnimateValue<T extends number | string>(options: ValueAnimationOptions<T>): JSAnimation<T>;
