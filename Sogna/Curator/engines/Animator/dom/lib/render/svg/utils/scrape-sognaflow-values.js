import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value.js";
import { TransformPropOrder as transformPropOrder } from "../../utils/keys-transform.js";
import { ScrapeSognaflowValuesFromProps as ScrapeHTMLSognaflowValuesFromProps } from "../../html/utils/scrape-sognaflow-values.js";
export function ScrapeSognaflowValuesFromProps(props, prevProps, visualElement) {
    const newValues = ScrapeHTMLSognaflowValuesFromProps(props, prevProps, visualElement);
    for (const key in props) {
        if (IsSognaflowValue(props[key]) ||
            IsSognaflowValue(prevProps[key])) {
            const targetKey = transformPropOrder.indexOf(key) !== -1
                ? "attr" + key.charAt(0).toUpperCase() + key.substring(1)
                : key;
            newValues[targetKey] = props[key];
        }
    }
    return newValues;
}
//# sourceMappingURL=scrape-sognaflow-values.js.map