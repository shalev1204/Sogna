import { ResolveVariant } from "../../render/utils/resolve-dynamic-variants.js"
import type { AnimationDefinition } from "../../node/types.js"
import type { VisualElement } from "../../render/visualelement.js"
import type { VisualElementAnimationOptions } from "./types.js"
import { AnimateTarget } from "./visual-element-target.js"
import { AnimateVariant } from "./visual-element-variant.js"

export function AnimateVisualElement(
    visualElement: VisualElement,
    definition: AnimationDefinition,
    options: VisualElementAnimationOptions = {}
) {
    visualElement.notify("AnimationStart", definition)
    let animation: Promise<any>

    if (Array.isArray(definition)) {
        const animations = definition.map((variant) =>
            AnimateVariant(visualElement, variant, options)
        )
        animation = Promise.all(animations)
    } else if (typeof definition === "string") {
        animation = AnimateVariant(visualElement, definition, options)
    } else {
        const resolvedDefinition =
            typeof definition === "function"
                ? ResolveVariant(visualElement, definition, options.custom)
                : definition

        animation = Promise.all(
            AnimateTarget(visualElement, resolvedDefinition, options)
        )
    }

    return animation.then(() => {
        visualElement.notify("AnimationComplete", definition)
    })
}
