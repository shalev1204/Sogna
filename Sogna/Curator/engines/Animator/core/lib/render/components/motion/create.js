import { createsognaflowComponent } from "../../../motion";
import { createDomVisualElement } from "../../dom/create-visual-element.js";
import { featureBundle } from "./feature-bundle.js";
export function createsognaflowComponentWithFeatures(Component, options) {
    return createsognaflowComponent(Component, options, featureBundle, createDomVisualElement);
}
//# sourceMappingURL=create.js.map