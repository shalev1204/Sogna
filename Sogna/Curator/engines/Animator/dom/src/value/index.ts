import {
    EasingFunction,
    SubscriptionManager,
    velocityPerSecond,
    warnOnce,
} from "sognaflow-utils"
import {
    AnimationPlaybackControlsWithThen,
    AnyResolvedKeyframe,
    TransformProperties,
} from "../animation/types"
import { frame } from "../frameloop"
import { time } from "../frameloop/sync-time"

/**
 * @public
 */
export type Subscriber<T> = (v: T) => void

/**
 * @public
 */
export type PassiveEffect<T> = (v: T, safeSetter: (v: T) => void) => void

export type StartAnimation = (
    complete: () => void
) => AnimationPlaybackControlsWithThen | undefined

export interface SognaflowValueEventCallbacks<V> {
    animationStart: () => void
    animationComplete: () => void
    animationCancel: () => void
    change: (latestValue: V) => void
    destroy: () => void
}

/**
 * Maximum time between the value of two frames, beyond which we
 * assume the velocity has since been 0.
 */
const MAX_VELOCITY_DELTA = 30

const isFloat = (value: any): value is string => {
    return !isNaN(parseFloat(value))
}

interface ResolvedValues {
    [key: string]: AnyResolvedKeyframe
}

export interface Owner {
    current: HTMLElement | unknown
    getProps: () => {
        onUpdate?: (latest: ResolvedValues) => void
        transformTemplate?: (
            transform: TransformProperties,
            generatedTransform: string
        ) => string
    }
}

export interface AccelerateConfig {
    factory: (animation: AnimationPlaybackControlsWithThen) => VoidFunction
    times: number[]
    keyframes: any[]
    ease?: EasingFunction | EasingFunction[]
    duration: number
    isTransformed?: boolean
}

export interface SognaflowValueOptions {
    owner?: Owner
}

export const CollectSognaflowValues: { current: SognaflowValue[] | undefined } = {
    current: undefined,
}

/**
 * `sognaflowValue` is used to track the state and velocity of sognaflow values.
 *
 * @public
 */
export class SognaflowValue<V = any> {
    /**
     * If a sognaflowValue has an owner, it was created internally within sognaflow
     * and therefore has no external listeners. It is therefore safe to animate via WAAPI.
     */
    owner?: Owner

    /**
     * The current state of the `sognaflowValue`.
     */
    private current: V | undefined

    /**
     * The previous state of the `sognaflowValue`.
     */
    private prev: V | undefined

    /**
     * The previous state of the `sognaflowValue` at the end of the previous frame.
     */
    private prevFrameValue: V | undefined

    /**
     * The last time the `sognaflowValue` was updated.
     */
    updatedAt: number

    /**
     * The time `prevFrameValue` was updated.
     */
    prevUpdatedAt: number | undefined

    /**
     * Add a passive effect to this `sognaflowValue`.
     *
     * A passive effect intercepts calls to `set`. For instance, `useSpring` adds
     * a passive effect that attaches a `spring` to the latest
     * set value. Hypothetically there could be a `useSmooth` that attaches an input smoothing effect.
     *
     * @internal
     */
    private passiveEffect?: PassiveEffect<V>
    private stopPassiveEffect?: VoidFunction

    /**
     * Whether the passive effect is active.
     */
    isEffectActive?: boolean

    /**
     * A reference to the currently-controlling animation.
     */
    animation?: AnimationPlaybackControlsWithThen

    /**
     * Tracks whether this value can output a velocity. Currently this is only true
     * if the value is numerical, but we might be able to widen the scope here and support
     * other value types.
     *
     * @internal
     */
    private canTrackVelocity: boolean | null = null

    /**
     * A list of sognaflowValues whose values are computed from this one.
     * This is a rough start to a proper signal-like dirtying system.
     */
    private dependents: Set<SognaflowValue> | undefined

    /**
     * Tracks whether this value should be removed
     */
    liveStyle?: boolean

    /**
     * Scroll timeline acceleration metadata. When set, VisualElement
     * can create a native WAAPI animation attached to a scroll timeline
     * instead of driving updates through JS.
     */
    accelerate?: AccelerateConfig

    /**
     * @param init - The initiating value
     * @param config - Optional configuration options
     *
     * -  `transformer`: A function to transform incoming values with.
     */
    constructor(init: V, options: SognaflowValueOptions = {}) {
        this.setCurrent(init)
        this.owner = options.owner
    }

    setCurrent(current: V) {
        this.current = current
        this.updatedAt = time.now()

        if (this.canTrackVelocity === null && current !== undefined) {
            this.canTrackVelocity = isFloat(this.current)
        }
    }

    setPrevFrameValue(prevFrameValue: V | undefined = this.current) {
        this.prevFrameValue = prevFrameValue
        this.prevUpdatedAt = this.updatedAt
    }

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
    onChange(subscription: Subscriber<V>): () => void {
        if (process.env.NODE_ENV !== "production") {
            warnOnce(
                false,
                `value.onChange(callback) is deprecated. Switch to value.on("change", callback).`
            )
        }
        return this.on("change", subscription)
    }

    /**
     * An object containing a SubscriptionManager for each active event.
     */
    private events: {
        [key: string]: SubscriptionManager<any>
    } = {}

    on<EventName extends keyof SognaflowValueEventCallbacks<V>>(
        eventName: EventName,
        callback: SognaflowValueEventCallbacks<V>[EventName]
    ) {
        if (!this.events[eventName]) {
            this.events[eventName] = new SubscriptionManager()
        }

        const unsubscribe = this.events[eventName].add(callback)

        if (eventName === "change") {
            return () => {
                unsubscribe()

                /**
                 * If we have no more change listeners by the start
                 * of the next frame, stop active animations.
                 */
                frame.read(() => {
                    if (!this.events.change.getSize()) {
                        this.stop()
                    }
                })
            }
        }

        return unsubscribe
    }

    clearListeners() {
        for (const eventManagers in this.events) {
            this.events[eventManagers].clear()
        }
    }

    /**
     * Attaches a passive effect to the `sognaflowValue`.
     */
    attach(passiveEffect: PassiveEffect<V>, stopPassiveEffect: VoidFunction) {
        this.passiveEffect = passiveEffect
        this.stopPassiveEffect = stopPassiveEffect
    }

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
    set(v: V) {
        if (!this.passiveEffect) {
            this.updateAndNotify(v)
        } else {
            this.passiveEffect(v, this.updateAndNotify)
        }
    }

    setWithVelocity(prev: V, current: V, delta: number) {
        this.set(current)
        this.prev = undefined
        this.prevFrameValue = prev
        this.prevUpdatedAt = this.updatedAt - delta
    }

    /**
     * Set the state of the `sognaflowValue`, stopping any active animations,
     * effects, and resets velocity to `0`.
     */
    jump(v: V, endAnimation = true) {
        this.updateAndNotify(v)
        this.prev = v
        this.prevUpdatedAt = this.prevFrameValue = undefined
        endAnimation && this.stop()
        if (this.stopPassiveEffect) this.stopPassiveEffect()
    }

    dirty() {
        this.events.change?.notify(this.current)
    }

    addDependent(dependent: SognaflowValue) {
        if (!this.dependents) {
            this.dependents = new Set()
        }
        this.dependents.add(dependent)
    }

    removeDependent(dependent: SognaflowValue) {
        if (this.dependents) {
            this.dependents.delete(dependent)
        }
    }

    updateAndNotify = (v: V) => {
        const currentTime = time.now()

        /**
         * If we're updating the value during another frame or eventloop
         * than the previous frame, then the we set the previous frame value
         * to current.
         */
        if (this.updatedAt !== currentTime) {
            this.setPrevFrameValue()
        }

        this.prev = this.current

        this.setCurrent(v)

        // Update update subscribers
        if (this.current !== this.prev) {
            this.events.change?.notify(this.current)

            if (this.dependents) {
                for (const dependent of this.dependents) {
                    dependent.dirty()
                }
            }
        }
    }

    /**
     * Returns the latest state of `sognaflowValue`
     *
     * @returns - The latest state of `sognaflowValue`
     *
     * @public
     */
    get() {
        if (CollectSognaflowValues.current) {
            CollectSognaflowValues.current.push(this)
        }

        return this.current!
    }

    /**
     * @public
     */
    getPrevious() {
        return this.prev
    }

    /**
     * Returns the latest velocity of `sognaflowValue`
     *
     * @returns - The latest velocity of `sognaflowValue`. Returns `0` if the state is non-numerical.
     *
     * @public
     */
    getVelocity() {
        const currentTime = time.now()

        if (
            !this.canTrackVelocity ||
            this.prevFrameValue === undefined ||
            currentTime - this.updatedAt > MAX_VELOCITY_DELTA
        ) {
            return 0
        }

        const delta = Math.min(
            this.updatedAt - this.prevUpdatedAt!,
            MAX_VELOCITY_DELTA
        )

        // Casts because of parseFloat's poor typing
        return velocityPerSecond(
            parseFloat(this.current as any) -
                parseFloat(this.prevFrameValue as any),
            delta
        )
    }

    hasAnimated = false

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
    start(startAnimation: StartAnimation) {
        this.stop()

        return new Promise<void>((resolve) => {
            this.hasAnimated = true
            this.animation = startAnimation(resolve)

            if (this.events.animationStart) {
                this.events.animationStart.notify()
            }
        }).then(() => {
            if (this.events.animationComplete) {
                this.events.animationComplete.notify()
            }
            this.clearAnimation()
        })
    }

    /**
     * Stop the currently active animation.
     *
     * @public
     */
    stop() {
        if (this.animation) {
            this.animation.stop()
            if (this.events.animationCancel) {
                this.events.animationCancel.notify()
            }
        }
        this.clearAnimation()
    }

    /**
     * Returns `true` if this value is currently animating.
     *
     * @public
     */
    isAnimating() {
        return !!this.animation
    }

    private clearAnimation() {
        delete this.animation
    }

    /**
     * Destroy and clean up subscribers to this `sognaflowValue`.
     *
     * The `SognaflowValue` hooks like `UseSognaflowValue` and `UseTransform` automatically
     * handle the lifecycle of the returned `SognaflowValue`, so this method is only necessary if you've manually
     * created a `SognaflowValue` via the `CreateSognaflowValue` function.
     *
     * @public
     */
    destroy() {
        this.dependents?.clear()
        this.events.destroy?.notify()
        this.clearListeners()
        this.stop()

        if (this.stopPassiveEffect) {
            this.stopPassiveEffect()
        }
    }
}

export function CreateSognaflowValue<V>(init: V, options?: SognaflowValueOptions) {
    return new SognaflowValue<V>(init, options)
}
