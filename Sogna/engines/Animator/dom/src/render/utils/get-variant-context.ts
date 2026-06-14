import { IsVariantLabel } from "./is-variant-label.js"
import { variantProps } from "./variant-props.js"

const numVariantProps = variantProps.length

type VariantStateContext = {
    initial?: string | string[]
    animate?: string | string[]
    exit?: string | string[]
    whileHover?: string | string[]
    whileDrag?: string | string[]
    whileFocus?: string | string[]
    whileTap?: string | string[]
}

/**
 * Get variant context from a visual element's parent chain.
 * Uses `any` type for visualElement to avoid circular dependencies.
 */
export function GetVariantContext(
    visualElement?: any
): undefined | VariantStateContext {
    if (!visualElement) return undefined

    if (!visualElement.isControllingVariants) {
        const context = visualElement.parent
            ? GetVariantContext(visualElement.parent) || {}
            : {}
        if (visualElement.props.initial !== undefined) {
            context.initial = visualElement.props.initial as any
        }
        return context
    }

    const context: VariantStateContext = {}
    for (let i = 0; i < numVariantProps; i++) {
const name = variantProps[i] as keyof typeof context
const prop = visualElement.props[name]

        if (IsVariantLabel(prop) || prop === false) {
;(context as any)[name] = prop
        }
    }

    return context
}
