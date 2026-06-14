import { AnimateSognaflowValue } from "../interfaces/sognaflow-value.js"
import type {
    AnimationPlaybackControlsWithThen,
    AnyResolvedKeyframe,
    UnresolvedValueKeyframe,
    ValueAnimationTransition,
} from "../types.js"
import {
    CreateSognaflowValue,
    SognaflowValue,
} from "../../value"
import { IsSognaflowValue } from "../../value/utils/is-sognaflow-value.js"

export function AnimateSingleValue<V extends AnyResolvedKeyframe>(
    value: SognaflowValue<V> | V,
    keyframes: V | UnresolvedValueKeyframe<V>[],
    options?: ValueAnimationTransition
): AnimationPlaybackControlsWithThen {
    const sognaflowValue = IsSognaflowValue(value) ? value : CreateSognaflowValue(value)

    sognaflowValue.start(AnimateSognaflowValue("", sognaflowValue, keyframes, options))

    return sognaflowValue.animation!
}

