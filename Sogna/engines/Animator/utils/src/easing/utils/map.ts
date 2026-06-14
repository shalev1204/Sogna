import { invariant } from "../../errors.js"
import { noop } from "../../noop.js"
import { anticipate } from "../anticipate.js"
import { backIn, backInOut, backOut } from "../back.js"
import { circIn, circInOut, circOut } from "../circ.js"
import { cubicBezier } from "../cubic-bezier.js"
import { easeIn, easeInOut, easeOut } from "../ease.js"
import { Easing, EasingFunction } from "../types.js"
import { isBezierDefinition } from "./is-bezier-definition.js"

const easingLookup = {
    linear: noop,
    easeIn,
    easeInOut,
    easeOut,
    circIn,
    circInOut,
    circOut,
    backIn,
    backInOut,
    backOut,
    anticipate,
}

const isValidEasing = (easing: Easing): easing is keyof typeof easingLookup => {
    return typeof easing === "string"
}

export const easingDefinitionToFunction = (
    definition: Easing
): EasingFunction => {
    if (isBezierDefinition(definition)) {
        // If cubic bezier definition, create bezier curve
        invariant(
            definition.length === 4,
            `Cubic bezier arrays must contain four numerical values.`,
            "cubic-bezier-length"
        )

        const [x1, y1, x2, y2] = definition
        return cubicBezier(x1, y1, x2, y2)
    } else if (isValidEasing(definition)) {
        // Else lookup from table
        invariant(
            easingLookup[definition] !== undefined,
            `Invalid easing type '${definition}'`,
            "invalid-easing-type"
        )
        return easingLookup[definition]
    }

    return definition
}
