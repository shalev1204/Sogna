import { isCSSVar } from "../../render/dom/is-css-var.js"
import { TransformProps } from "../../render/utils/keys-transform.js"
import { IsHTMLElement } from "../../utils/is-html-element.js"
import { SognaflowValue } from "../../value"
import { SognaflowValueState } from "../SognaflowValueState.js"
import { createSelectorEffect } from "../utils/create-dom-effect.js"
import { createEffect } from "../utils/create-effect.js"
import { buildTransform } from "./transform.js"

const originProps = new Set(["originX", "originY", "originZ"])

export const AddStyleValue = (
    element: HTMLElement | SVGElement,
    state: SognaflowValueState,
    key: string,
    value: SognaflowValue
) => {
    let render: VoidFunction | undefined = undefined
    let computed: SognaflowValue | undefined = undefined

    if (TransformProps.has(key)) {
        if (!state.get("transform")) {
            // If this is an HTML element, we need to set the transform-box to fill-box
            // to normalise the transform relative to the element's bounding box
            if (!IsHTMLElement(element) && !state.get("transformBox")) {
                AddStyleValue(
                    element,
                    state,
                    "transformBox",
                    new SognaflowValue("fill-box")
                )
            }

            state.set("transform", new SognaflowValue("none"), () => {
                element.style.transform = buildTransform(state)
            })
        }

        computed = state.get("transform")
    } else if (originProps.has(key)) {
        if (!state.get("transformOrigin")) {
            state.set("transformOrigin", new SognaflowValue(""), () => {
                const originX = state.latest.originX ?? "50%"
                const originY = state.latest.originY ?? "50%"
                const originZ = state.latest.originZ ?? 0
                element.style.transformOrigin = `${originX} ${originY} ${originZ}`
            })
        }

        computed = state.get("transformOrigin")
    } else if (isCSSVar(key)) {
        render = () => {
            element.style.setProperty(key, state.latest[key] as string)
        }
    } else {
        render = () => {
            element.style[key as any] = state.latest[key] as string
        }
    }

    return state.set(key, value, render, computed)
}

export const StyleEffect = /*@__PURE__*/ createSelectorEffect(
    /*@__PURE__*/ createEffect(AddStyleValue)
)
