import { animatesognaflowValue } from "../interfaces/sognaflow-value"
import type {
    AnimationPlaybackControlsWithThen,
    AnyResolvedKeyframe,
    UnresolvedValueKeyframe,
    ValueAnimationTransition,
} from "../types"
import {
    sognaflowValue as createsognaflowValue,
    sognaflowValue,
} from "../../value"
import { issognaflowValue } from "../../value/utils/is-sognaflow-value"

export function animateSingleValue<V extends AnyResolvedKeyframe>(
    value: sognaflowValue<V> | V,
    keyframes: V | UnresolvedValueKeyframe<V>[],
    options?: ValueAnimationTransition
): AnimationPlaybackControlsWithThen {
    const sognaflowValue = issognaflowValue(value) ? value : createsognaflowValue(value)

    sognaflowValue.start(animatesognaflowValue("", sognaflowValue, keyframes, options))

    return sognaflowValue.animation!
}
