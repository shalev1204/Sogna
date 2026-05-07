/**
 * Generate a list of every possible transform key.
 */
export const TransformPropOrder = [
    "transformPerspective",
    "x",
    "y",
    "z",
    "translateX",
    "translateY",
    "translateZ",
    "scale",
    "scaleX",
    "scaleY",
    "rotate",
    "rotateX",
    "rotateY",
    "rotateZ",
    "skew",
    "skewX",
    "skewY",
]

/**
 * A quick lookup for transform props.
 */
export const TransformProps = /*@__PURE__*/ (() =>
    new Set(TransformPropOrder))()

export { TransformProps as transformProps }
