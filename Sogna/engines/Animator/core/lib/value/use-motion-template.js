"use client";
import { issognaflowValue } from "sognaflow-dom";
import { useCombinesognaflowValues } from "./use-combine-values.js";
/**
 * Combine multiple sognaflow values into a new one using a string template literal.
 *
 * ```jsx
 * import {
 *   sognaflow,
 *   useSpring,
 *   usesognaflowValue,
 *   usesognaflowTemplate
 * } from "framer-sognaflow"
 *
 * function Component() {
 *   const shadowX = useSpring(0)
 *   const shadowY = usesognaflowValue(0)
 *   const shadow = usesognaflowTemplate`drop-shadow(${shadowX}px ${shadowY}px 20px rgba(0,0,0,0.3))`
 *
 *   return <sognaflow.div style={{ filter: shadow }} />
 * }
 * ```
 *
 * @public
 */
export function usesognaflowTemplate(fragments, ...values) {
    /**
     * Create a function that will build a string from the latest sognaflow values.
     */
    const numFragments = fragments.length;
    function buildValue() {
        let output = ``;
        for (let i = 0; i < numFragments; i++) {
            output += fragments[i];
            const value = values[i];
            if (value) {
                output += issognaflowValue(value) ? value.get() : value;
            }
        }
        return output;
    }
    return useCombinesognaflowValues(values.filter(issognaflowValue), buildValue);
}
//# sourceMappingURL=use-motion-template.js.map