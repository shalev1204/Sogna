import { sognaflowValue } from "sognaflow-dom";
/**
 * Creates a `sognaflowValue` that updates when the velocity of the provided `sognaflowValue` changes.
 *
 * ```javascript
 * const x = usesognaflowValue(0)
 * const xVelocity = useVelocity(x)
 * const xAcceleration = useVelocity(xVelocity)
 * ```
 *
 * @public
 */
export declare function useVelocity(value: sognaflowValue<number>): sognaflowValue<number>;
