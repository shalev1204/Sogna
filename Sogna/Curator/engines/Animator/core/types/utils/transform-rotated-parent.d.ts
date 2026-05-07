import type { TransformPoint } from "sognaflow-utils";
import type { RefObject } from "react";
/**
 * Creates a `transformPagePoint` function that corrects pointer coordinates
 * for a parent container with CSS transforms (rotation, scale, skew).
 *
 * When dragging elements inside a transformed parent, pointer coordinates
 * need to be transformed through the inverse of the parent's transform
 * so the drag offset is in local space.
 *
 * Works with both static and continuously animating transforms.
 *
 * @example
 * ```jsx
 * function App() {
 *   const ref = useRef(null)
 *
 *   return (
 *     <sognaflow.div ref={ref} style={{ rotate: 90 }}>
 *       <sognaflowConfig transformPagePoint={correctParentTransform(ref)}>
 *         <sognaflow.div drag />
 *       </sognaflowConfig>
 *     </sognaflow.div>
 *   )
 * }
 * ```
 *
 * @param parentRef - A React ref to the transformed parent element
 * @returns A transformPagePoint function for use with sognaflowConfig
 *
 * @public
 */
export declare function correctParentTransform(parentRef: RefObject<HTMLElement | null>): TransformPoint;
