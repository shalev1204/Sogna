"use client"

import * as React from "react"
import { useContext, useMemo } from "react"
import { resolveTransition } from "sognaflow-dom"
import { sognaflowConfigContext } from "../../context/motionconfigcontext.js"
import {
    loadExternalIsValidProp,
    IsValidProp,
} from "../../render/dom/utils/filter-props.js"
import { useConstant } from "../../utils/use-constant.js"

export interface sognaflowConfigProps extends Partial<sognaflowConfigContext> {
    children?: React.ReactNode
    isValidProp?: IsValidProp
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
export function sognaflowConfig({
    children,
    isValidProp,
    ...config
}: sognaflowConfigProps) {
    isValidProp && loadExternalIsValidProp(isValidProp)

    /**
     * Inherit props from any parent sognaflowConfig components
     */
    const parentConfig = useContext(sognaflowConfigContext) as any
    config = { ...parentConfig, ...config }

    config.transition = resolveTransition(
        config.transition,
        parentConfig.transition
    )

    /**
     * Don't allow isStatic to change between renders as it affects how many hooks
     * sognaflow components fire.
     */
    config.isStatic = useConstant(() => config.isStatic)

    /**
     * Creating a new config context object will re-render every `sognaflow` component
     * every time it renders. So we only want to create a new one sparingly.
     */
    const context = useMemo(
        () => config,
        [
            JSON.stringify(config.transition),
            config.transformPagePoint,
            config.reducedsognaflow,
            config.skipAnimations,
        ]
    )

    return (
        <sognaflowConfigContext.Provider value={context as sognaflowConfigContext}>
            {children}
        </sognaflowConfigContext.Provider>
    )
}
