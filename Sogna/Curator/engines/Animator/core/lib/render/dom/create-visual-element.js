import { HTMLVisualElement, SVGVisualElement } from "sognaflow-dom";
import { Fragment } from "react";
import { isSVGComponent } from "./utils/is-svg-component.js";
export const createDomVisualElement = (Component, options) => {
    /**
     * Use explicit isSVG override if provided, otherwise auto-detect
     */
    const isSVG = options.isSVG ?? isSVGComponent(Component);
    return isSVG
        ? new SVGVisualElement(options)
        : new HTMLVisualElement(options, {
            allowProjection: Component !== Fragment,
        });
};
//# sourceMappingURL=create-visual-element.js.map
