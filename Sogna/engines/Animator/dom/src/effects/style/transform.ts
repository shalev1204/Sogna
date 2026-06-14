import { TransformPropOrder } from "../../render/utils/keys-transform.js"
import { SognaflowValueState } from "../sognaflowvaluestate.js"

const translateAlias = {
    x: "translateX",
    y: "translateY",
    z: "translateZ",
    transformPerspective: "perspective",
}

export function buildTransform(state: SognaflowValueState) {
    let transform = ""
    let transformIsDefault = true

    /**
     * Loop over all possible transforms in order, adding the ones that
     * are present to the transform string.
     */
    for (let i = 0; i < TransformPropOrder.length; i++) {
        const key = TransformPropOrder[i] as keyof typeof translateAlias
        const value = state.latest[key]

        if (value === undefined) continue

        let valueIsDefault = true
        if (typeof value === "number") {
            valueIsDefault = value === (key.startsWith("scale") ? 1 : 0)
        } else {
            const parsed = parseFloat(value)
            valueIsDefault = key.startsWith("scale") ? parsed === 1 : parsed === 0
        }

        if (!valueIsDefault) {
            transformIsDefault = false
            const transformName = translateAlias[key] || key
            transform += `${transformName}(${value}) `
        }
    }

    return transformIsDefault ? "none" : transform.trim()
}
