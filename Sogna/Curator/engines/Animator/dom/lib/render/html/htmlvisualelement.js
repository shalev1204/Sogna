import { IsCSSVariableName } from "../../animation/utils/is-css-variable.js";
import { TransformProps } from "../utils/keys-transform.js";
import { defaultTransformValue, readTransformValue, } from "../dom/parse-transform.js";
import { measureViewportBox } from "../../projection/utils/measure.js";
import { DOMVisualElement } from "../dom/domvisualelement.js";
import { buildHTMLStyles } from "./utils/build-styles.js";
import { renderHTML } from "./utils/render.js";
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values.js";
export function getComputedStyle(element) {
    return window.getComputedStyle(element);
}
export class HTMLVisualElement extends DOMVisualElement {
    constructor() {
        super(...arguments);
        this.type = "html";
        this.renderInstance = renderHTML;
    }
    readValueFromInstance(instance, key) {
        if (TransformProps.has(key)) {
            return this.projection?.isProjecting
                ? defaultTransformValue(key)
                : readTransformValue(instance, key);
        }
        else {
            const computedStyle = getComputedStyle(instance);
            const value = (IsCSSVariableName(key)
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
//# sourceMappingURL=htmlvisualelement.js.map
