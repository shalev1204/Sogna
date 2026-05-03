import { createsognaflowComponent, sognaflowComponentOptions } from "../../../sognaflow"
import { createDomVisualElement } from "../../dom/create-visual-element"
import { DOMsognaflowComponents } from "../../dom/types"
import { CreateVisualElement } from "../../types"
import { featureBundle } from "./feature-bundle"

export function createsognaflowComponentWithFeatures<
    Props,
    TagName extends keyof DOMsognaflowComponents | string = "div"
>(
    Component: TagName | string | React.ComponentType<Props>,
    options?: sognaflowComponentOptions
) {
    return createsognaflowComponent(
        Component,
        options,
        featureBundle,
        createDomVisualElement as CreateVisualElement<Props, TagName>
    )
}
