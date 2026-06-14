import { BezierDefinition } from "sognaflow-utils"

export const cubicBezierAsString = ([a, b, c, d]: BezierDefinition) =>
    `cubic-bezier(${a}, ${b}, ${c}, ${d})`
