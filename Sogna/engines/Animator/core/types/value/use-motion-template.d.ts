import { sognaflowValue } from "sognaflow-dom";
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
export declare function usesognaflowTemplate(fragments: TemplateStringsArray, ...values: Array<sognaflowValue | number | string>): sognaflowValue<string>;
