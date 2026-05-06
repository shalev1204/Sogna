import { CreateSognaflowValue } from "../../value"
import { ResolveVariant } from "./resolve-dynamic-variants.js"
import { IsKeyframesTarget } from "./is-keyframes-target.js"
import type { AnimationDefinition } from "../../node/types.js"
import type {
    AnyResolvedKeyframe,
    UnresolvedValueKeyframe,
    ValueKeyframesDefinition,
} from "../../animation/types.js"
import type { VisualElement } from "../VisualElement.js"

/**
 * Set VisualElement's sognaflowValue, creating a new sognaflowValue for it if
 * it doesn't exist.
 */
function SetSognaflowValue(
    visualElement: VisualElement,
    key: string,
    value: AnyResolvedKeyframe
) {
    if (visualElement.hasValue(key)) {
        visualElement.getValue(key)!.set(value)
    } else {
        visualElement.addValue(key, CreateSognaflowValue(value))
    }
}

function resolveFinalValueInKeyframes(
    v: ValueKeyframesDefinition
): UnresolvedValueKeyframe {
    // TODO maybe throw if v.length - 1 is placeholder token?
    return IsKeyframesTarget(v) ? v[v.length - 1] || 0 : v
}

export function setTarget(
    visualElement: VisualElement,
    definition: AnimationDefinition
) {
    const resolved = ResolveVariant(visualElement, definition)
    let { transitionEnd = {}, transition = {}, ...target } = resolved || {}

    target = { ...target, ...transitionEnd }

    for (const key in target) {
        const value = resolveFinalValueInKeyframes(
            target[key as keyof typeof target] as any
        )
        SetSognaflowValue(visualElement, key, value as AnyResolvedKeyframe)
    }
}
