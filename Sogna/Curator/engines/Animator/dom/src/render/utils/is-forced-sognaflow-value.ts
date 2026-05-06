import { TransformProps } from "./keys-transform.js"
import type { SognaflowNodeOptions } from "../../node/types.js"
import {
    scaleCorrectors,
    addScaleCorrector,
} from "../../projection/styles/scale-correction.js"

export { scaleCorrectors, addScaleCorrector }

export function IsForcedSognaflowValue(
    key: string,
    { layout, layoutId }: SognaflowNodeOptions
) {
    return (
        TransformProps.has(key) ||
        key.startsWith("origin") ||
        ((layout || layoutId !== undefined) &&
            (!!scaleCorrectors[key] || key === "opacity"))
    )
}

