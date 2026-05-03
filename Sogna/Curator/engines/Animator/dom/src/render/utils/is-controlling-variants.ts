import type { SognaflowNodeOptions } from "../../node/types"
import { IsAnimationControls } from "./is-animation-controls"
import { IsVariantLabel } from "./is-variant-label"
import { variantProps } from "./variant-props"

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
