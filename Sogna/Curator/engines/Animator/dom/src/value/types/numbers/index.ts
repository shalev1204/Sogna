import { clamp } from "sognaflow-utils"

export const NumberType = {
    test: (v: number) => typeof v === "number",
    parse: parseFloat,
    transform: (v: number) => v,
}

export const Alpha = {
    ...NumberType,
    transform: (v: number) => clamp(0, 1, v),
}

export const Scale = {
    ...NumberType,
    default: 1,
}
