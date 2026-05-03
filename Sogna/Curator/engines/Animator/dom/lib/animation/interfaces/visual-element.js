import { ResolveVariant } from "../../render/utils/resolve-dynamic-variants";
import { AnimateTarget } from "./visual-element-target";
import { AnimateVariant } from "./visual-element-variant";
export function AnimateVisualElement(visualElement, definition, options = {}) {
    visualElement.notify("AnimationStart", definition);
    let animation;
    if (Array.isArray(definition)) {
        const animations = definition.map((variant) => AnimateVariant(visualElement, variant, options));
        animation = Promise.all(animations);
    }
    else if (typeof definition === "string") {
        animation = AnimateVariant(visualElement, definition, options);
    }
    else {
        const resolvedDefinition = typeof definition === "function"
            ? ResolveVariant(visualElement, definition, options.custom)
            : definition;
        animation = Promise.all(AnimateTarget(visualElement, resolvedDefinition, options));
    }
    return animation.then(() => {
        visualElement.notify("AnimationComplete", definition);
    });
}
//# sourceMappingURL=visual-element.js.map