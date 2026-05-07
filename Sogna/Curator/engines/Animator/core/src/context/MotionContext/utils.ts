import { isControllingVariants, isVariantLabel } from "sognaflow-dom"
import type { sognaflowContextProps } from "."
import { sognaflowProps } from "../../motion/types"

export function getCurrentTreeVariants(
    props: sognaflowProps,
    context: sognaflowContextProps
): sognaflowContextProps {
    if (isControllingVariants(props)) {
        const { initial, animate } = props
        return {
            initial:
                initial === false || isVariantLabel(initial)
                    ? (initial as any)
                    : undefined,
            animate: isVariantLabel(animate) ? animate : undefined,
        }
    }
    return props.inherit !== false ? context : {}
}
