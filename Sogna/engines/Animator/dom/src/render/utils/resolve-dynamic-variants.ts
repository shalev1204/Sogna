import type {
    AnimationDefinition,
    TargetAndTransition,
    TargetResolver,
} from "../../node/types.js"
import { ResolveVariantFromProps } from "./resolve-variants.js"

/**
 * Resolves a variant if it's a variant resolver.
 * Uses `any` type for visualElement to avoid circular dependencies.
 */
export function ResolveVariant(
    visualElement: any,
    definition?: TargetAndTransition | TargetResolver,
    custom?: any
): TargetAndTransition
export function ResolveVariant(
    visualElement: any,
    definition?: AnimationDefinition,
    custom?: any
): TargetAndTransition | undefined
export function ResolveVariant(
    visualElement: any,
    definition?: AnimationDefinition,
    custom?: any
) {
    const props = visualElement.getProps()
    return ResolveVariantFromProps(
        props,
        definition,
        custom !== undefined ? custom : props.custom,
        visualElement
    )
}
