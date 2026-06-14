import { Frame } from "../../frameloop"
import { SognaflowValue } from "../../value"
import { AddAttrValue } from "../attr"
import { SognaflowValueState } from "../sognaflowvaluestate.js"
import { AddStyleValue } from "../style"
import { createSelectorEffect } from "../utils/create-dom-effect.js"
import { createEffect } from "../utils/create-effect.js"

function AddSVGPathValue(
    element: SVGElement,
    state: SognaflowValueState,
    key: string,
    value: SognaflowValue
) {
    Frame.render(() => element.setAttribute("pathLength", "1"))

    if (key === "pathOffset") {
        return state.set(key, value, () => {
            // Use unitless value to avoid Safari zoom bug
            const offset = state.latest[key]
            element.setAttribute("stroke-dashoffset", `${-offset}`)
        })
    } else {
        if (!state.get("stroke-dasharray")) {
            state.set("stroke-dasharray", new SognaflowValue("1 1"), () => {
                const { pathLength = 1, pathSpacing } = state.latest

                // Use unitless values to avoid Safari zoom bug
                element.setAttribute(
                    "stroke-dasharray",
                    `${pathLength} ${pathSpacing ?? 1 - Number(pathLength)}`
                )
            })
        }

        return state.set(key, value, undefined, state.get("stroke-dasharray"))
    }
}

const AddSVGValue = (
    element: SVGElement,
    state: SognaflowValueState,
    key: string,
    value: SognaflowValue
) => {
    if (key.startsWith("path")) {
        return AddSVGPathValue(element, state, key, value)
    } else if (key.startsWith("attr")) {
        return AddAttrValue(element, state, convertAttrKey(key), value)
    }

    const handler = key in element.style ? AddStyleValue : AddAttrValue
    return handler(element, state, key, value)
}

export const SVGEffect = /*@__PURE__*/ createSelectorEffect(
    /*@__PURE__*/ createEffect(AddSVGValue)
)

function convertAttrKey(key: string) {
    return key.replace(/^attr([A-Z])/, (_, firstChar) =>
        firstChar.toLowerCase()
    )
}
