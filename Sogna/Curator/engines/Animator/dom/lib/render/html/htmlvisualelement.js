import { IsCSSVariableName as isCSSVariableName } from "../../animation/utils/is-css-variable";
import { TransformProps as transformProps } from "../utils/keys-transform";
import { DefaultTransformValue as defaultTransformValue, ReadTransformValue as readTransformValue, } from "../dom/parse-transform";
import { measureViewportBox } from "../../projection/utils/measure";
import { DOMVisualElement } from "../dom/domvisualelement";
import { BuildHTMLStyles as buildHTMLStyles } from "./utils/build-styles";
import { RenderHTML as renderHTML } from "./utils/render";
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values";
export function GetComputedStyle(element) {
    return window.getComputedStyle(element);
}
export class HTMLVisualElement extends DOMVisualElement {
    constructor() {
        super(...arguments);
        this.type = "html";
        this.renderInstance = renderHTML;
    }
    readValueFromInstance(instance, key) {
        if (transformProps.has(key)) {
            return this.projection?.isProjecting
                ? defaultTransformValue(key)
                : readTransformValue(instance, key);
        }
        else {
            const computedStyle = GetComputedStyle(instance);
            const value = (isCSSVariableName(key)
                ? computedStyle.getPropertyValue(key)
                : computedStyle[key]) || 0;
            return typeof value === "string" ? value.trim() : value;
        }
    }
    measureInstanceViewportBox(instance, { transformPagePoint }) {
        return measureViewportBox(instance, transformPagePoint);
    }
    build(renderState, latestValues, props) {
        buildHTMLStyles(renderState, latestValues, props.transformTemplate);
    }
    ScrapeSognaflowValuesFromProps(props, prevProps, visualElement) {
        return ScrapeSognaflowValuesFromProps(props, prevProps, visualElement);
    }
}
//# sourceMappingURL=HTMLVisualElement.js.map