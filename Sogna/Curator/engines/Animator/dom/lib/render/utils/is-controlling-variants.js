import { IsAnimationControls } from "./is-animation-controls.js";
import { IsVariantLabel } from "./is-variant-label.js";
import { variantProps } from "./variant-props.js";
export function IsControllingVariants(props) {
    return (IsAnimationControls(props.animate) ||
variantProps.some((name) => IsVariantLabel(props[name])));
}
export function IsVariantNode(props) {
    return Boolean(IsControllingVariants(props) || props.variants);
}
export const isControllingVariants = IsControllingVariants;
export const isVariantNode = IsVariantNode;
//# sourceMappingURL=is-controlling-variants.js.map
