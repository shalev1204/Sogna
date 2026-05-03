import { ResolveVariantFromProps } from "./resolve-variants";
export function ResolveVariant(visualElement, definition, custom) {
    const props = visualElement.getProps();
    return ResolveVariantFromProps(props, definition, custom !== undefined ? custom : props.custom, visualElement);
}
//# sourceMappingURL=resolve-dynamic-variants.js.map