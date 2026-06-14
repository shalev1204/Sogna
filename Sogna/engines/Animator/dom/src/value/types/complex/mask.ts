import { Complex } from "."
import { AnyResolvedKeyframe } from "../../../animation/types.js"

export const Mask = {
    ...Complex,
    getAnimatableNone: (v: AnyResolvedKeyframe) => {
        const parsed = Complex.parse(v)
        const transformer = Complex.createTransformer(v)
        return transformer(
            parsed.map((v) =>
                typeof v === "number" ? 0 : typeof v === "object" ? { ...v, alpha: 1 } : v
            )
        )
    },
}

export const mask = Mask

