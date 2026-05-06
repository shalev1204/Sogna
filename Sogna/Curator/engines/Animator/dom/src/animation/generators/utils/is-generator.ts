import { AnimationGeneratorType, GeneratorFactory } from "../../types.js"

export function isGenerator(
    type?: AnimationGeneratorType
): type is GeneratorFactory {
    return typeof type === "function" && "applyToOptions" in type
}
