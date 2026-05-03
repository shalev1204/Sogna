import { IsVariantLabel } from "./is-variant-label";
import { VariantProps as variantProps } from "./variant-props";
const numVariantProps = variantProps.length;
/**
 * Get variant context from a visual element's parent chain.
 * Uses `any` type for visualElement to avoid circular dependencies.
 */
export function GetVariantContext(visualElement) {
    if (!visualElement)
        return undefined;
    if (!visualElement.isControllingVariants) {
        const context = visualElement.parent
            ? GetVariantContext(visualElement.parent) || {}
            : {};
        if (visualElement.props.initial !== undefined) {
            context.initial = visualElement.props.initial;
        }
        return context;
    }
    const context = {};
    for (let i = 0; i < numVariantProps; i++) {
        const name = variantProps[i];
        const prop = visualElement.props[name];
        if (IsVariantLabel(prop) || prop === false) {
            ;
            context[name] = prop;
        }
    }
    return context;
}
//# sourceMappingURL=get-variant-context.js.map