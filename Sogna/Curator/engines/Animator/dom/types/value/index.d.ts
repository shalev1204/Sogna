import { EasingFunction } from "sognaflow-utils";
import { AnimationPlaybackControlsWithThen, AnyResolvedKeyframe, TransformProperties } from "../animation/types.js";
/**
 * @public
 */
export type Subscriber<T> = (v: T) => void;
/**
 * @public
 */
export type PassiveEffect<T> = (v: T, safeSetter: (v: T) => void) => void;
export type StartAnimation = (complete: () => void) => AnimationPlaybackControlsWithThen | undefined;
export interface SognaflowValueEventCallbacks<V> {
    animationStart: () => void;
    animationComplete: () => void;
    animationCancel: () => void;
    change: (latestValue: V) => void;
    destroy: () => void;
}
interface ResolvedValues {
    [key: string]: AnyResolvedKeyframe;
}
export interface Owner {
    current: HTMLElement | unknown;
    getProps: () => {
        onUpdate?: (latest: ResolvedValues) => void;
        transformTemplate?: (transform: TransformProperties, generatedTransform: string) => string;
    };
}
export interface AccelerateConfig {
    factory: (animation: AnimationPlaybackControlsWithThen) => VoidFunction;
    times: number[];
    keyframes: any[];
    ease?: EasingFunction | EasingFunction[];
    duration: number;
    isTransformed?: boolean;
}
export interface SognaflowValueOptions {
    owner?: Owner;
}
export declare const CollectSognaflowValues: {
    current: SognaflowValue[] | undefined;
};
/**
 * `sognaflowValue` is used to track the state and velocity of sognaflow values.
 *
 * @public
 */
export declare class SognaflowValue<V = any> {
    /**
     * If a sognaflowValue has an owner, it was created internally within sognaflow
     * and therefore has no external listeners. It is therefore safe to animate via WAAPI.
     */
    owner?: Owner;
    /**
     * The current state of the `sognaflowValue`.
     */
    private current;
    /**
     * The previous state of the `sognaflowValue`.
     */
    private prev;
    /**
     * The previous state of the `sognaflowValue` at the end of the previous frame.
     */
    private prevFrameValue;
    /**
     * The last time the `sognaflowValue` was updated.
     */
    updatedAt: number;
    /**
     * The time `prevFrameValue` was updated.
     */
    prevUpdatedAt: number | undefined;
    private stopPassiveEffect?;
    /**
     * Whether the passive effect is active.
     */
    isEffectActive?: boolean;
    /**
     * A reference to the currently-controlling animation.
     */
    animation?: AnimationPlaybackControlsWithThen;
    /**
     * A list of sognaflowValues whose values are computed from this one.
     * This is a rough start to a proper signal-like dirtying system.
     */
    private dependents;
    /**
     * Tracks whether this value should be removed
     */
    liveStyle?: boolean;
    /**
     * Scroll timeline acceleration metadata. When set, VisualElement
     * can create a native WAAPI animation attached to a scroll timeline
     * instead of driving updates through JS.
     */
    accelerate?: AccelerateConfig;
    /**
     * @param init - The initiating value
     * @param config - Optional configuration options
     *
     * -  `transformer`: A function to transform incoming values with.
     */
    constructor(init: V, options?: SognaflowValueOptions);
    setCurrent(current: V): void;
    setPrevFrameValue(prevFrameValue?: V | undefined): void;
    /**
     * Adds a function that will be notified when the `sognaflowValue` is updated.
     *
     * It returns a function that, when called, will cancel the subscription.
     *
     * When calling `onChange` inside a React component, it should be wrapped with the
     * `useEffect` hook. As it returns an unsubscribe function, this should be returned
     * from the `useEffect` function to ensure you don't add duplicate subscribers..
     *
     * ```jsx
     * export const MyComponent = () => {
     *   const x = UseSognaflowValue(0)
     *   const y = UseSognaflowValue(0)
     *   const opacity = UseSognaflowValue(1)
     *
     *   useEffect(() => {
     *     function updateOpacity() {
     *       const maxXY = Math.max(x.get(), y.get())
     *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
     *       opacity.set(newOpacity)
     *     }
     *
     *     const unsubscribeX = x.on("change", updateOpacity)
     *     const unsubscribeY = y.on("change", updateOpacity)
     *
     *     return () => {
     *       unsubscribeX()
     *       unsubscribeY()
     *     }
     *   }, [])
     *
     *   return <sognaflow.div style={{ x }} />
     * }
     * ```
     *
     * @param subscriber - A function that receives the latest value.
     * @returns A function that, when called, will cancel this subscription.
     *
     * @deprecated
     */
    onChange(subscription: Subscriber<V>): () => void;
    /**
     * An object containing a SubscriptionManager for each active event.
     */
    private events;
    on<EventName extends keyof SognaflowValueEventCallbacks<V>>(eventName: EventName, callback: SognaflowValueEventCallbacks<V>[EventName]): VoidFunction;
    clearListeners(): void;
    /**
     * Attaches a passive effect to the `sognaflowValue`.
     */
    attach(passiveEffect: PassiveEffect<V>, stopPassiveEffect: VoidFunction): void;
    /**
     * Sets the state of the `sognaflowValue`.
     *
     * @remarks
     *
     * ```jsx
     * const x = UseSognaflowValue(0)
     * x.set(10)
     * ```
     *
     * @param latest - Latest value to set.
     * @param render - Whether to notify render subscribers. Defaults to `true`
     *
     * @public
     */
    set(v: V): void;
    setWithVelocity(prev: V, current: V, delta: number): void;
    /**
     * Set the state of the `sognaflowValue`, stopping any active animations,
     * effects, and resets velocity to `0`.
     */
    jump(v: V, endAnimation?: boolean): void;
    dirty(): void;
    addDependent(dependent: SognaflowValue): void;
    removeDependent(dependent: SognaflowValue): void;
    updateAndNotify: (v: V) => void;
    /**
     * Returns the latest state of `sognaflowValue`
     *
     * @returns - The latest state of `sognaflowValue`
     *
     * @public
     */
    get(): NonNullable<V>;
    /**
     * @public
     */
    getPrevious(): V | undefined;
    /**
     * Returns the latest velocity of `sognaflowValue`
     *
     * @returns - The latest velocity of `sognaflowValue`. Returns `0` if the state is non-numerical.
     *
     * @public
     */
    getVelocity(): number;
    hasAnimated: boolean;
    /**
     * Registers a new animation to control this `sognaflowValue`. Only one
     * animation can drive a `sognaflowValue` at one time.
     *
     * ```jsx
     * value.start()
     * ```
     *
     * @param animation - A function that starts the provided animation
     */
    start(startAnimation: StartAnimation): Promise<void>;
    /**
     * Stop the currently active animation.
     *
     * @public
     */
    stop(): void;
    /**
     * Returns `true` if this value is currently animating.
     *
     * @public
     */
    isAnimating(): boolean;
    private clearAnimation;
    /**
     * Destroy and clean up subscribers to this `sognaflowValue`.
     *
     * The `SognaflowValue` hooks like `UseSognaflowValue` and `UseTransform` automatically
     * handle the lifecycle of the returned `SognaflowValue`, so this method is only necessary if you've manually
     * created a `SognaflowValue` via the `CreateSognaflowValue` function.
     *
     * @public
     */
    destroy(): void;
}
export declare function CreateSognaflowValue<V>(init: V, options?: SognaflowValueOptions): SognaflowValue<V>;
export {};
