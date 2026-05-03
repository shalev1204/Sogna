import { TransformPropOrder } from "./keys-transform"

export const PositionalKeys = new Set([
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    ...TransformPropOrder,
])
