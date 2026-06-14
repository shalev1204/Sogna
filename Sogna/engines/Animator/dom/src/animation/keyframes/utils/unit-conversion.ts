import type { Box } from "sognaflow-utils"
import { parseValueFromTransform } from "../../../render/dom/parse-transform.js"
import { TransformPropOrder } from "../../../render/utils/keys-transform.js"
import { SognaflowValue } from "../../../value"
import { NumberType } from "../../../value/types/numbers"
import { Px } from "../../../value/types/numbers/units.js"
import { ValueType } from "../../../value/types/types.js"
import { AnyResolvedKeyframe } from "../../types.js"
import { WithRender } from "../types.js"

export const IsNumOrPxType = (v?: ValueType): v is ValueType =>
    v === NumberType || v === Px

type GetActualMeasurementInPixels = (
    bbox: Box,
    computedStyle: Partial<CSSStyleDeclaration>
) => number

const transformKeys = new Set(["x", "y", "z"])
const nonTranslationalTransformKeys = TransformPropOrder.filter(
    (key) => !transformKeys.has(key)
)

type RemovedTransforms = [string, AnyResolvedKeyframe][]
export function RemoveNonTranslationalTransform(visualElement: WithRender) {
    const removedTransforms: RemovedTransforms = []

    nonTranslationalTransformKeys.forEach((key) => {
        const value: SognaflowValue<AnyResolvedKeyframe> | undefined =
            visualElement.getValue(key)
        if (value !== undefined) {
            removedTransforms.push([key, value.get()])
            value.set(key.startsWith("scale") ? 1 : 0)
        }
    })

    return removedTransforms
}

export const PositionalValues: { [key: string]: GetActualMeasurementInPixels } =
    {
        // Dimensions
        width: (
            { x },
            { paddingLeft = "0", paddingRight = "0", boxSizing }
        ) => {
            const width = x.max - x.min
            return boxSizing === "border-box"
                ? width
                : width - parseFloat(paddingLeft) - parseFloat(paddingRight)
        },
        height: (
            { y },
            { paddingTop = "0", paddingBottom = "0", boxSizing }
        ) => {
            const height = y.max - y.min
            return boxSizing === "border-box"
                ? height
                : height - parseFloat(paddingTop) - parseFloat(paddingBottom)
        },

        top: (_bbox, { top }) => parseFloat(top as string),
        left: (_bbox, { left }) => parseFloat(left as string),
        bottom: ({ y }, { top }) => parseFloat(top as string) + (y.max - y.min),
        right: ({ x }, { left }) =>
            parseFloat(left as string) + (x.max - x.min),

        // Transform
        x: (_bbox, { transform }) => parseValueFromTransform(transform, "x"),
        y: (_bbox, { transform }) => parseValueFromTransform(transform, "y"),
    }

// Alias translate longform names
PositionalValues.translateX = PositionalValues.x
PositionalValues.translateY = PositionalValues.y

export const positionalValues = PositionalValues
