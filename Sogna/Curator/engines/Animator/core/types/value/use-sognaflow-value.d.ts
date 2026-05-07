import { sognaflowValue } from "sognaflow-dom";
/**
 * Creates a `sognaflowValue` to track the state and velocity of a value.
 *
 * Usually, these are created automatically. For advanced use-cases, like use with `useTransform`, you can create `sognaflowValue`s externally and pass them into the animated component via the `style` prop.
 *
 * ```jsx
 * export const MyComponent = () => {
 *   const scale = usesognaflowValue(1)
 *
 *   return <sognaflow.div style={{ scale }} />
 * }
 * ```
 *
 * @param initial - The initial state.
 *
 * @public
 */
export declare function usesognaflowValue<T>(initial: T): sognaflowValue<T>;
