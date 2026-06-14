import type { UnresolvedValueKeyframe, ValueKeyframesDefinition } from "../../animation/types.js"

export const IsKeyframesTarget = (
    v: ValueKeyframesDefinition
): v is UnresolvedValueKeyframe[] => {
    return Array.isArray(v)
}
