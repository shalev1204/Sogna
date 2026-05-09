"use client";
import { sognaflowValue } from "sognaflow-dom";
import { useContext, useEffect, useState } from "react";
import { sognaflowConfigContext } from "../context/motionconfigcontext";
import { useConstant } from "../utils/use-constant.js";
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
export function usesognaflowValue(initial) {
    const value = useConstant(() => sognaflowValue(initial));
    /**
     * If this sognaflow value is being used in static mode, like on
     * the Framer canvas, force components to rerender when the sognaflow
     * value is updated.
     */
    const { isStatic } = useContext(sognaflowConfigContext);
    if (isStatic) {
        const [, setLatest] = useState(initial);
        useEffect(() => value.on("change", setLatest), []);
    }
    return value;
}
//# sourceMappingURL=use-sognaflow-value.js.map
