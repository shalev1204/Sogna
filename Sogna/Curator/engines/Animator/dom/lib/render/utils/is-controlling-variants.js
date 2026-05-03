import { IsAnimationControls } from "./is-animation-controls";
import { IsVariantLabel } from "./is-variant-label";
import { VariantProps } from "./variant-props";
export function IsControllingVariants(props) {
    return (IsAnimationControls(props.animate) ||
        VariantProps.some((name) => IsVariantLabel(props[name])));
}
export function IsVariantNode(props) {
    return Boolean(IsControllingVariants(props) || props.variants);
}
//# sourceMappingURL=is-controlling-variants.js.map