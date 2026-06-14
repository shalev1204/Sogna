import type {
    UnresolvedValueKeyframe,
    ValueKeyframesDefinition,
} from "sognaflow-dom"

export const isKeyframesTarget = (
    v: ValueKeyframesDefinition
): v is UnresolvedValueKeyframe[] => {
    return Array.isArray(v)
}
