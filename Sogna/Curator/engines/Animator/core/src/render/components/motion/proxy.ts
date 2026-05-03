import { createDomVisualElement } from "../../dom/create-visual-element"
import { createsognaflowProxy } from "../create-proxy"
import { featureBundle } from "./feature-bundle"

export const sognaflow = /*@__PURE__*/ createsognaflowProxy(
    featureBundle,
    createDomVisualElement
)
