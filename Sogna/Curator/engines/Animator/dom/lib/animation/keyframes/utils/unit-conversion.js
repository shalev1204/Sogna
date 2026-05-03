import { ParseValueFromTransform as parseValueFromTransform } from "../../../render/dom/parse-transform";
import { TransformPropOrder } from "../../../render/utils/keys-transform";
import { NumberType } from "../../../value/types/numbers";
import { Px } from "../../../value/types/numbers/units";
export const IsNumOrPxType = (v) => v === NumberType || v === Px;
const transformKeys = new Set(["x", "y", "z"]);
const nonTranslationalTransformKeys = TransformPropOrder.filter((key) => !transformKeys.has(key));
export function RemoveNonTranslationalTransform(visualElement) {
    const removedTransforms = [];
    nonTranslationalTransformKeys.forEach((key) => {
        const value = visualElement.getValue(key);
        if (value !== undefined) {
            removedTransforms.push([key, value.get()]);
            value.set(key.startsWith("scale") ? 1 : 0);
        }
    });
    return removedTransforms;
}
export const PositionalValues = {
    // Dimensions
    width: ({ x }, { paddingLeft = "0", paddingRight = "0", boxSizing }) => {
        const width = x.max - x.min;
        return boxSizing === "border-box"
            ? width
            : width - parseFloat(paddingLeft) - parseFloat(paddingRight);
    },
    height: ({ y }, { paddingTop = "0", paddingBottom = "0", boxSizing }) => {
        const height = y.max - y.min;
        return boxSizing === "border-box"
            ? height
            : height - parseFloat(paddingTop) - parseFloat(paddingBottom);
    },
    top: (_bbox, { top }) => parseFloat(top),
    left: (_bbox, { left }) => parseFloat(left),
    bottom: ({ y }, { top }) => parseFloat(top) + (y.max - y.min),
    right: ({ x }, { left }) => parseFloat(left) + (x.max - x.min),
    // Transform
    x: (_bbox, { transform }) => parseValueFromTransform(transform, "x"),
    y: (_bbox, { transform }) => parseValueFromTransform(transform, "y"),
};
// Alias translate longform names
PositionalValues.translateX = PositionalValues.x;
PositionalValues.translateY = PositionalValues.y;
//# sourceMappingURL=unit-conversion.js.map