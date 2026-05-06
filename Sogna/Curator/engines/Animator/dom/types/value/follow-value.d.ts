import { SognaflowValue } from ".";
import { AnyResolvedKeyframe, ValueAnimationTransition } from "../animation/types.js";
/**
 * Options for useFollowValue hook, extending ValueAnimationTransition
 * but excluding lifecycle callbacks that don't make sense for the hook pattern.
 */
export type FollowValueOptions = Omit<ValueAnimationTransition, "onUpdate" | "onComplete" | "onPlay" | "onRepeat" | "onStop"> & {
    /**
     * When true, the first change from a tracked `SognaflowValue` source
     * will jump to the new value instead of animating. Subsequent
     * changes animate normally. This prevents unwanted animations
     * on page refresh or back navigation (e.g. `useScroll` + `useSpring`).
     *
     * @default false
     */
    skipInitialAnimation?: boolean;
};
/**
 * Create a `SognaflowValue` that animates to its latest value using any transition type.
 * Can either be a value or track another `SognaflowValue`.
 *
 * ```jsx
 * const x = CreateSognaflowValue(0)
 * const y = FollowValue(x, { type: "spring", stiffness: 300 })
 * // or with tween
 * const z = FollowValue(x, { type: "tween", duration: 0.5, ease: "easeOut" })
 * ```
 *
 * @param source - Initial value or SognaflowValue to track
 * @param options - Animation transition options
 * @returns `SognaflowValue`
 *
 * @public
 */
export declare function FollowValue<T extends AnyResolvedKeyframe>(source: T | SognaflowValue<T>, options?: FollowValueOptions): SognaflowValue<T>;
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
export declare function AttachFollow<T extends AnyResolvedKeyframe>(value: SognaflowValue<T>, source: T | SognaflowValue<T>, options?: FollowValueOptions): VoidFunction;
