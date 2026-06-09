import { FollowValueOptions, sognaflowValue } from "sognaflow-dom";
/**
 * Creates a `sognaflowValue` that, when `set`, will use the specified animation transition to animate to its new state.
 *
 * Unlike `useSpring` which is limited to spring animations, `useFollowValue` accepts any sognaflow transition
 * including spring, tween, inertia, and keyframes.
 *
 * It can either work as a stand-alone `sognaflowValue` by initialising it with a value, or as a subscriber
 * to another `sognaflowValue`.
 *
 * @remarks
 *
 * ```jsx
 * // Spring animation (default)
 * const x = useFollowValue(0, { stiffness: 300 })
 *
 * // Tween animation
 * const y = useFollowValue(0, { type: "tween", duration: 0.5, ease: "easeOut" })
 *
 * // Track another sognaflowValue with spring
 * const source = usesognaflowValue(0)
 * const z = useFollowValue(source, { type: "spring", damping: 10 })
 *
 * // Inertia animation
 * const w = useFollowValue(0, { type: "inertia", velocity: 100 })
 * ```
 *
 * @param inputValue - `sognaflowValue` or number. If provided a `sognaflowValue`, when the input `sognaflowValue` changes, the created `sognaflowValue` will animate towards that value using the specified transition.
 * @param options - Animation transition options. Supports all transition types: spring, tween, inertia, keyframes.
 * @returns `sognaflowValue`
 *
 * @public
 */
export declare function useFollowValue(source: sognaflowValue<string>, options?: FollowValueOptions): sognaflowValue<string>;
export declare function useFollowValue(source: string, options?: FollowValueOptions): sognaflowValue<string>;
export declare function useFollowValue(source: sognaflowValue<number>, options?: FollowValueOptions): sognaflowValue<number>;
export declare function useFollowValue(source: number, options?: FollowValueOptions): sognaflowValue<number>;
