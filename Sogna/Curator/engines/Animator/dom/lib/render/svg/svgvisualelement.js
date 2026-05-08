import { TransformProps } from "../utils/keys-transform.js";
import { GetDefaultValueType } from "../../value/types/maps/defaults.js";
import { createBox } from "../../projection/geometry/models.js";
import { DOMVisualElement } from "../dom/domvisualelement.js";
import { camelToDash } from "../dom/utils/camel-to-dash.js";
import { buildSVGAttrs } from "./utils/build-attrs.js";
import { camelCaseAttributes } from "./utils/camel-case-attrs.js";
import { isSVGTag } from "./utils/is-svg-tag.js";
import { renderSVG } from "./utils/render.js";
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values.js";
export class SVGVisualElement extends DOMVisualElement {
    constructor() {
        super(...arguments);
        this.type = "svg";
        this.isSVGTag = false;
        this.measureInstanceViewportBox = createBox;
    }
    getBaseTargetFromProps(props, key) {
        return props[key];
    }
    readValueFromInstance(instance, key) {
        if (TransformProps.has(key)) {
            const defaultType = GetDefaultValueType(key);
            return defaultType ? defaultType.default || 0 : 0;
        }
        key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
        return instance.getAttribute(key);
    }
    ScrapeSognaflowValuesFromProps(props, prevProps, visualElement) {
        return ScrapeSognaflowValuesFromProps(props, prevProps, visualElement);
    }
    build(renderState, latestValues, props) {
        buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate, props.style);
    }
    renderInstance(instance, renderState, styleProp, projection) {
        renderSVG(instance, renderState, styleProp, projection);
    }
    mount(instance) {
        this.isSVGTag = isSVGTag(instance.tagName);
        super.mount(instance);
    }
}
//# sourceMappingURL=svgvisualelement.js.map