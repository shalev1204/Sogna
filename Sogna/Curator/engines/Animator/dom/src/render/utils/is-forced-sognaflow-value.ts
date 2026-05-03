import { transformProps } from "./keys-transform"
import type { SognaflowNodeOptions } from "../../node/types"
import {
    scaleCorrectors,
    addScaleCorrector,
} from "../../projection/styles/scale-correction"

export { scaleCorrectors, addScaleCorrector }

export function IsForcedSognaflowValue(
    key: string,
    { layout, layoutId }: SognaflowNodeOptions
) {
    return (
        transformProps.has(key) ||
        key.startsWith("origin") ||
        ((layout || layoutId !== undefined) &&
            (!!scaleCorrectors[key] || key === "opacity"))
    )
}

