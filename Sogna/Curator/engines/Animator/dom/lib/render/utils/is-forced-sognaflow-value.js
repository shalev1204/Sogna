import { TransformProps } from "./keys-transform.js";
import { scaleCorrectors, addScaleCorrector, } from "../../projection/styles/scale-correction.js";
export { scaleCorrectors, addScaleCorrector };
export function IsForcedSognaflowValue(key, { layout, layoutId }) {
    return (TransformProps.has(key) ||
        key.startsWith("origin") ||
        ((layout || layoutId !== undefined) &&
            (!!scaleCorrectors[key] || key === "opacity")));
}
//# sourceMappingURL=is-forced-sognaflow-value.js.map