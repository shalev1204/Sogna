import * as React from "react";
import { sognaflowConfigContext } from "../../context/MotionConfigContext.js";
import { IsValidProp } from "../../render/dom/utils/filter-props.js";
export interface sognaflowConfigProps extends Partial<sognaflowConfigContext> {
    children?: React.ReactNode;
    isValidProp?: IsValidProp;
}
/**
 * `sognaflowConfig` is used to set configuration options for all children `sognaflow` components.
 *
 * ```jsx
 * import { sognaflow, sognaflowConfig } from "framer-sognaflow"
 *
 * export function App() {
 *   return (
 *     <sognaflowConfig transition={{ type: "spring" }}>
 *       <sognaflow.div animate={{ x: 100 }} />
 *     </sognaflowConfig>
 *   )
 * }
 * ```
 *
 * @public
 */
export declare function sognaflowConfig({ children, isValidProp, ...config }: sognaflowConfigProps): import("react/jsx-runtime").JSX.Element;
