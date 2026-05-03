import { IsSognaflowValue } from "../../../value/utils/is-sognaflow-value";
import { IsForcedSognaflowValue } from "../../utils/is-forced-sognaflow-value";
export function ScrapeSognaflowValuesFromProps(props, prevProps, visualElement) {
    const style = props.style;
    const prevStyle = prevProps?.style;
    const newValues = {};
    if (!style)
        return newValues;
    for (const key in style) {
        if (IsSognaflowValue(style[key]) ||
            (prevStyle && IsSognaflowValue(prevStyle[key])) ||
            IsForcedSognaflowValue(key, props) ||
            visualElement?.getValue(key)?.liveStyle !== undefined) {
            newValues[key] = style[key];
        }
    }
    return newValues;
}
//# sourceMappingURL=scrape-sognaflow-values.js.map