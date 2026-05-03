import { CreateSognaflowValue } from "../../value"
import { resolveVariant } from "./resolve-dynamic-variants"
import { isKeyframesTarget } from "./is-keyframes-target"
import type { AnimationDefinition } from "../../node/types"
import type {
    AnyResolvedKeyframe,
    UnresolvedValueKeyframe,
    ValueKeyframesDefinition,
} from "../../animation/types"
import type { VisualElement } from "../VisualElement"

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
    return isKeyframesTarget(v) ? v[v.length - 1] || 0 : v
}

export function setTarget(
    visualElement: VisualElement,
    definition: AnimationDefinition
) {
    const resolved = resolveVariant(visualElement, definition)
    let { transitionEnd = {}, transition = {}, ...target } = resolved || {}

    target = { ...target, ...transitionEnd }

    for (const key in target) {
        const value = resolveFinalValueInKeyframes(
            target[key as keyof typeof target] as any
        )
        SetSognaflowValue(visualElement, key, value as AnyResolvedKeyframe)
    }
}
