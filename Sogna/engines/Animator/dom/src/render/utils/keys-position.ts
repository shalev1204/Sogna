import { TransformPropOrder } from "./keys-transform.js"

export const PositionalKeys = new Set([
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    ...TransformPropOrder,
])
