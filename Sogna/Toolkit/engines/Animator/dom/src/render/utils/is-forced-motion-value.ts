import { transformProps } from "./keys-transform"
import type { sognaflowNodeOptions } from "../../node/types"
import {
    scaleCorrectors,
    addScaleCorrector,
} from "../../projection/styles/scale-correction"

export { scaleCorrectors, addScaleCorrector }

export function isForcedsognaflowValue(
    key: string,
    { layout, layoutId }: sognaflowNodeOptions
) {
    return (
        transformProps.has(key) ||
        key.startsWith("origin") ||
        ((layout || layoutId !== undefined) &&
            (!!scaleCorrectors[key] || key === "opacity"))
    )
}
