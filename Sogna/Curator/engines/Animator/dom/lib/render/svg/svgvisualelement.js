import { TransformProps } from "../utils/keys-transform";
import { GetDefaultValueType } from "../../value/types/maps/defaults";
import { createBox } from "../../projection/geometry/models";
import { DOMVisualElement } from "../dom/domvisualelement";
import { CamelToDash } from "../dom/utils/camel-to-dash";
import { BuildSVGAttrs as buildSVGAttrs } from "./utils/build-attrs";
import { CamelCaseAttributes as camelCaseAttributes } from "./utils/camel-case-attrs";
import { IsSVGTag } from "./utils/is-svg-tag";
import { RenderSVG } from "./utils/render";
import { ScrapeSognaflowValuesFromProps } from "./utils/scrape-sognaflow-values";
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
        key = !camelCaseAttributes.has(key) ? CamelToDash(key) : key;
        return instance.getAttribute(key);
    }
    ScrapeSognaflowValuesFromProps(props, prevProps, visualElement) {
        return ScrapeSognaflowValuesFromProps(props, prevProps, visualElement);
    }
    build(renderState, latestValues, props) {
        buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate, props.style);
    }
    renderInstance(instance, renderState, styleProp, projection) {
        RenderSVG(instance, renderState, styleProp, projection);
    }
    mount(instance) {
        this.isSVGTag = IsSVGTag(instance.tagName);
        super.mount(instance);
    }
}
//# sourceMappingURL=SVGVisualElement.js.map