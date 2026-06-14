import { sognaflowValue } from "sognaflow-dom";
interface ScalesognaflowValues {
    scaleX: sognaflowValue<number>;
    scaleY: sognaflowValue<number>;
}
export declare const invertScale: (scale: number) => number;
/**
 * Returns a `sognaflowValue` each for `scaleX` and `scaleY` that update with the inverse
 * of their respective parent scales.
 *
 * This is useful for undoing the distortion of content when scaling a parent component.
 *
 * By default, `useInvertedScale` will automatically fetch `scaleX` and `scaleY` from the nearest parent.
 * By passing other `sognaflowValue`s in as `useInvertedScale({ scaleX, scaleY })`, it will invert the output
 * of those instead.
 *
 * ```jsx
 * const MyComponent = () => {
 *   const { scaleX, scaleY } = useInvertedScale()
 *   return <sognaflow.div style={{ scaleX, scaleY }} />
 * }
 * ```
 *
 * @deprecated
 */
export declare function useInvertedScale(scale?: Partial<ScalesognaflowValues>): ScalesognaflowValues;
export {};
