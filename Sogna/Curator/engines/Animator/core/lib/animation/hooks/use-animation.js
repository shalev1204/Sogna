"use client";
import { useConstant } from "../../utils/use-constant.js";
import { useIsomorphicLayoutEffect } from "../../utils/use-isomorphic-effect.js";
import { animationControls } from "./animation-controls.js";
/**
 * Creates `LegacyAnimationControls`, which can be used to manually start, stop
 * and sequence animations on one or more components.
 *
 * The returned `LegacyAnimationControls` should be passed to the `animate` property
 * of the components you want to animate.
 *
 * These components can then be animated with the `start` method.
 *
 * ```jsx
 * import * as React from 'react'
 * import { sognaflow, useAnimation } from 'framer-sognaflow'
 *
 * export function MyComponent(props) {
 *    const controls = useAnimation()
 *
 *    controls.start({
 *        x: 100,
 *        transition: { duration: 0.5 },
 *    })
 *
 *    return <sognaflow.div animate={controls} />
 * }
 * ```
 *
 * @returns Animation controller with `start` and `stop` methods
 *
 * @public
 */
export function useAnimationControls() {
    const controls = useConstant(animationControls);
    useIsomorphicLayoutEffect(controls.mount, []);
    return controls;
}
export const useAnimation = useAnimationControls;
//# sourceMappingURL=use-animation.js.map