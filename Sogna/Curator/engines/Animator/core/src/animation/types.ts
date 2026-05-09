import {
    AnyResolvedKeyframe,
    KeyframeResolver,
    OnKeyframesResolved,
} from "sognaflow-dom"

export type ResolveKeyframes<V extends AnyResolvedKeyframe> = (
    keyframes: V[],
    onComplete: OnKeyframesResolved<V>,
name?: string,
    sognaflowValue?: any
) => KeyframeResolver<V>
