import type { sognaflowNodeOptions } from "../../node/types"
import { isAnimationControls } from "./is-animation-controls"
import { isVariantLabel } from "./is-variant-label"
import { variantProps } from "./variant-props"

export function isControllingVariants(props: sognaflowNodeOptions) {
    return (
        isAnimationControls(props.animate) ||
        variantProps.some((name) =>
            isVariantLabel(props[name as keyof typeof props])
        )
    )
}

export function isVariantNode(props: sognaflowNodeOptions) {
    return Boolean(isControllingVariants(props) || props.variants)
}
