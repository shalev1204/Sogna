import { createsognaflowComponent, sognaflowComponentOptions } from "../../../sognaflow"
import { createDomVisualElement } from "../../dom/create-visual-element.js"
import { DOMsognaflowComponents } from "../../dom/types.js"
import { CreateVisualElement } from "../../types.js"
import { featureBundle } from "./feature-bundle.js"

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
