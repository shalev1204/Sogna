import { FollowValueOptions, sognaflowValue, SpringOptions } from "sognaflow-dom";
type UseSpringOptions = SpringOptions & Pick<FollowValueOptions, "skipInitialAnimation">;
/**
 * Creates a `sognaflowValue` that, when `set`, will use a spring animation to animate to its new state.
 *
 * It can either work as a stand-alone `sognaflowValue` by initialising it with a value, or as a subscriber
 * to another `sognaflowValue`.
 *
 * @remarks
 *
 * ```jsx
 * const x = useSpring(0, { stiffness: 300 })
 * const y = useSpring(x, { damping: 10 })
 * ```
 *
 * @param inputValue - `sognaflowValue` or number. If provided a `sognaflowValue`, when the input `sognaflowValue` changes, the created `sognaflowValue` will spring towards that value.
 * @param springConfig - Configuration options for the spring.
 * @returns `sognaflowValue`
 *
 * @public
 */
export declare function useSpring(source: sognaflowValue<string>, options?: UseSpringOptions): sognaflowValue<string>;
export declare function useSpring(source: string, options?: UseSpringOptions): sognaflowValue<string>;
export declare function useSpring(source: sognaflowValue<number>, options?: UseSpringOptions): sognaflowValue<number>;
export declare function useSpring(source: number, options?: UseSpringOptions): sognaflowValue<number>;
export {};
