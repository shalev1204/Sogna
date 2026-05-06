import { IsAnimationControls } from "./is-animation-controls.js";
import { IsVariantLabel } from "./is-variant-label.js";
import { VariantProps } from "./variant-props.js";
export function IsControllingVariants(props) {
    return (IsAnimationControls(props.animate) ||
        VariantProps.some((name) => IsVariantLabel(props[name])));
}
export function IsVariantNode(props) {
    return Boolean(IsControllingVariants(props) || props.variants);
}
//# sourceMappingURL=is-controlling-variants.js.map