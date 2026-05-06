import { TransformProps } from "./keys-transform.js";
import { ScaleCorrectors, AddScaleCorrector, } from "../../projection/styles/scale-correction.js";
export { ScaleCorrectors, AddScaleCorrector };
export function IsForcedSognaflowValue(key, { layout, layoutId }) {
    return (TransformProps.has(key) ||
        key.startsWith("origin") ||
        ((layout || layoutId !== undefined) &&
            (!!ScaleCorrectors[key] || key === "opacity")));
}
//# sourceMappingURL=is-forced-sognaflow-value.js.map