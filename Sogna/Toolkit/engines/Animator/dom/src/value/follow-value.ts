import { sognaflowValue, sognaflowValue } from "."
import { JSAnimation } from "../animation/JSAnimation"
import { AnyResolvedKeyframe, ValueAnimationTransition } from "../animation/types"
import { frame } from "../frameloop"
import { issognaflowValue } from "./utils/is-sognaflow-value"

/**
 * Options for useFollowValue hook, extending ValueAnimationTransition
 * but excluding lifecycle callbacks that don't make sense for the hook pattern.
 */
export type FollowValueOptions = Omit<
    ValueAnimationTransition,
    "onUpdate" | "onComplete" | "onPlay" | "onRepeat" | "onStop"
> & {
    /**
     * When true, the first change from a tracked `sognaflowValue` source
     * will jump to the new value instead of animating. Subsequent
     * changes animate normally. This prevents unwanted animations
     * on page refresh or back navigation (e.g. `useScroll` + `useSpring`).
     *
     * @default false
     */
    skipInitialAnimation?: boolean
}

/**
 * Create a `sognaflowValue` that animates to its latest value using any transition type.
 * Can either be a value or track another `sognaflowValue`.
 *
 * ```jsx
 * const x = sognaflowValue(0)
 * const y = followValue(x, { type: "spring", stiffness: 300 })
 * // or with tween
 * const z = followValue(x, { type: "tween", duration: 0.5, ease: "easeOut" })
 * ```
 *
 * @param source - Initial value or sognaflowValue to track
 * @param options - Animation transition options
 * @returns `sognaflowValue`
 *
 * @public
 */
export function followValue<T extends AnyResolvedKeyframe>(
    source: T | sognaflowValue<T>,
    options?: FollowValueOptions
) {
    const initialValue = issognaflowValue(source) ? source.get() : source
    const value = sognaflowValue(initialValue)

    attachFollow(value, source, options)

    return value
}

/**
 * Attach an animation to a sognaflowValue that will animate whenever the value changes.
 * Similar to attachSpring but supports any transition type (spring, tween, inertia, etc.)
 *
 * @param value - The sognaflowValue to animate
 * @param source - Initial value or sognaflowValue to track
 * @param options - Animation transition options
 * @returns Cleanup function
 *
 * @public
 */
export function attachFollow<T extends AnyResolvedKeyframe>(
    value: sognaflowValue<T>,
    source: T | sognaflowValue<T>,
    options: FollowValueOptions = {}
): VoidFunction {
    const initialValue = value.get()

    let activeAnimation: JSAnimation<number> | null = null
    let latestValue = initialValue
    let latestSetter: (v: T) => void

    const unit =
        typeof initialValue === "string"
            ? initialValue.replace(/[\d.-]/g, "")
            : undefined

    const stopAnimation = () => {
        if (activeAnimation) {
            activeAnimation.stop()
            activeAnimation = null
        }
        value.animation = undefined
    }

    const startAnimation = () => {
        const currentValue = asNumber(value.get())
        const targetValue = asNumber(latestValue)

        // Don't animate if we're already at the target
        if (currentValue === targetValue) {
            stopAnimation()
            return
        }

        // Use the running animation's analytical velocity for accuracy,
        // falling back to the sognaflowValue's velocity for the initial animation.
        // This prevents systematic velocity loss at high frame rates (240hz+).
        const velocity = activeAnimation
            ? activeAnimation.getGeneratorVelocity()
            : value.getVelocity()

        stopAnimation()

        activeAnimation = new JSAnimation({
            keyframes: [currentValue, targetValue],
            velocity,
            // Default to spring if no type specified (matches useSpring behavior)
            type: "spring",
            restDelta: 0.001,
            restSpeed: 0.01,
            ...options,
            onUpdate: latestSetter,
        })
    }

    // Use a stable function reference so the frame loop Set deduplicates
    // multiple calls within the same frame (e.g. rapid mouse events)
    const scheduleAnimation = () => {
        startAnimation()
        value.animation = activeAnimation ?? undefined
        value["events"].animationStart?.notify()
        activeAnimation?.then(() => {
            value.animation = undefined
            value["events"].animationComplete?.notify()
        })
    }

    value.attach((v, set) => {
        latestValue = v
        latestSetter = (latest) => set(parseValue(latest, unit) as T)
        frame.postRender(scheduleAnimation)
    }, stopAnimation)

    if (issognaflowValue(source)) {
        let skipNextAnimation = options.skipInitialAnimation === true

        const removeSourceOnChange = source.on("change", (v) => {
            if (skipNextAnimation) {
                skipNextAnimation = false
                value.jump(parseValue(v, unit) as T, false)
            } else {
                value.set(parseValue(v, unit) as T)
            }
        })

        const removeValueOnDestroy = value.on("destroy", removeSourceOnChange)

        return () => {
            removeSourceOnChange()
            removeValueOnDestroy()
        }
    }

    return stopAnimation
}

function parseValue(v: AnyResolvedKeyframe, unit?: string) {
    return unit ? v + unit : v
}

function asNumber(v: AnyResolvedKeyframe) {
    return typeof v === "number" ? v : parseFloat(v)
}
