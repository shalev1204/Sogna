import type { VisualElement } from "sognaflow-dom"

// Fixes https://github.com/sognaflowdivision/sognaflow/issues/2270
export const getContextWindow = ({ current }: VisualElement<Element>) => {
    return current ? current.ownerDocument.defaultView : null
}
