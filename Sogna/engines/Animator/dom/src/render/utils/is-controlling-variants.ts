import type { SognaflowNodeOptions } from "../../node/types.js"
import { IsAnimationControls } from "./is-animation-controls.js"
import { IsVariantLabel } from "./is-variant-label.js"
import { variantProps } from "./variant-props.js"

export function IsControllingVariants(props: SognaflowNodeOptions) {
    return (
        IsAnimationControls(props.animate) ||
variantProps.some((name) =>
IsVariantLabel(props[name as keyof typeof props])
        )
    )
}

export function IsVariantNode(props: SognaflowNodeOptions) {
    return Boolean(IsControllingVariants(props) || props.variants)
}

export const isControllingVariants = IsControllingVariants
export const isVariantNode = IsVariantNode
