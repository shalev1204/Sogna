import { ValueTransition } from "../../types.js"
import { supportsLinearEasing } from "../../../utils/supports/linear-easing.js"
import { isGenerator } from "../../generators/utils/is-generator.js"

export function applyGeneratorOptions({
    type,
    ...options
}: ValueTransition): ValueTransition {
    if (isGenerator(type) && supportsLinearEasing()) {
        return type.applyToOptions!(options)
    } else {
        options.duration ??= 300
        options.ease ??= "easeOut"
    }

    return options
}
