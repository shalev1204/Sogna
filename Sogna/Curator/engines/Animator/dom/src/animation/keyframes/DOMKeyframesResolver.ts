import { PositionalKeys } from "../../render/utils/keys-position.js"
import { SognaflowValue } from "../../value"
import { FindDimensionValueType } from "../../value/types/dimensions.js"
import { AnyResolvedKeyframe } from "../types.js"
import { GetVariableValue } from "../utils/css-variables-conversion.js"
import {
    ContainsCSSVariable,
    IsCSSVariableToken,
} from "../utils/is-css-variable.js"
import {
    KeyframeResolver,
    OnKeyframesResolved,
    UnresolvedKeyframes,
} from "./keyframesresolver.js"
import { WithRender } from "./types.js"
import { IsNone } from "./utils/is-none.js"
import { MakeNoneKeyframesAnimatable } from "./utils/make-none-animatable.js"
import { IsNumOrPxType, PositionalValues } from "./utils/unit-conversion.js"

export class DOMKeyframesResolver<
    T extends AnyResolvedKeyframe
> extends KeyframeResolver<T> {
name: string
    element?: WithRender

    private removedTransforms?: [string, AnyResolvedKeyframe][]
    private measuredOrigin?: AnyResolvedKeyframe

    constructor(
        unresolvedKeyframes: UnresolvedKeyframes<AnyResolvedKeyframe>,
        onComplete: OnKeyframesResolved<T>,
name?: string,
        sognaflowValue?: SognaflowValue<T>,
        element?: WithRender
    ) {
        super(unresolvedKeyframes, onComplete, name, sognaflowValue, element, true)
    }

    readKeyframes() {
const { unresolvedKeyframes, element, name } = this

        if (!element || !element.current) return

        super.readKeyframes()

        /**
         * If any keyframe is a CSS variable, we need to find its value by sampling the element
         */
        for (let i = 0; i < unresolvedKeyframes.length; i++) {
            let keyframe = unresolvedKeyframes[i]

            if (typeof keyframe === "string") {
                keyframe = keyframe.trim()

                if (IsCSSVariableToken(keyframe)) {
                    const resolved = GetVariableValue(keyframe, element.current)

                    if (resolved !== undefined) {
                        unresolvedKeyframes[i] = resolved as T
                    }

                    if (i === unresolvedKeyframes.length - 1) {
                        this.finalKeyframe = keyframe as T
                    }
                }
            }
        }

        /**
         * Resolve "none" values. We do this potentially twice - once before and once after measuring keyframes.
         * This could be seen as inefficient but it's a trade-off to avoid measurements in more situations, which
         * have a far bigger performance impact.
         */
        this.resolveNoneKeyframes()

        /**
         * Check to see if unit type has changed. If so schedule jobs that will
         * temporarily set styles to the destination keyframes.
         * Skip if we have more than two keyframes or this isn't a positional value.
         * TODO: We can throw if there are multiple keyframes and the value type changes.
         */
if (!PositionalKeys.has(name) || unresolvedKeyframes.length !== 2) {
            return
        }

        const [origin, target] = unresolvedKeyframes
        const originType = FindDimensionValueType(origin)
        const targetType = FindDimensionValueType(target)

        /**
         * If one keyframe contains embedded CSS variables (e.g. in calc()) and the other
         * doesn't, we need to measure to convert to pixels. This handles GitHub issue #3410.
         */
        const originHasVar = ContainsCSSVariable(origin)
        const targetHasVar = ContainsCSSVariable(target)

if (originHasVar !== targetHasVar && PositionalValues[name]) {
            this.needsMeasurement = true
            return
        }

        if (IsNumOrPxType(originType) && IsNumOrPxType(targetType)) {
            for (let i = 0; i < unresolvedKeyframes.length; i++) {
                const value = unresolvedKeyframes[i]
                if (typeof value === "string") {
                    unresolvedKeyframes[i] = parseFloat(value as string)
                }
            }
} else if (PositionalValues[name]) {
            /**
             * Else, the only way to resolve this is by measuring the element.
             */
            this.needsMeasurement = true
        }
    }

    resolveNoneKeyframes() {
const { unresolvedKeyframes, name } = this
        const noneKeyframeIndexes: number[] = []

        for (let i = 0; i < unresolvedKeyframes.length; i++) {
            if (IsNone(unresolvedKeyframes[i])) {
                noneKeyframeIndexes.push(i)
            }
        }

        if (noneKeyframeIndexes.length) {
            MakeNoneKeyframesAnimatable(
                unresolvedKeyframes,
                noneKeyframeIndexes,
name
            )
        }
    }

    measureInitialState() {
const { element, unresolvedKeyframes, name } = this

        if (!element || !element.current) return

if (name === "height") {
            this.suspendedScrollY = window.pageYOffset
        }

this.measuredOrigin = PositionalValues[name](
            element.measureViewportBox(),
            window.getComputedStyle(element.current)
        )

        unresolvedKeyframes[0] = this.measuredOrigin

        // Set final key frame to measure after next render
        const measureKeyframe =
            unresolvedKeyframes[unresolvedKeyframes.length - 1]

        if (measureKeyframe !== undefined) {
element.getValue(name, measureKeyframe).jump(measureKeyframe, false)
        }
    }

    measureEndState() {
const { element, name, unresolvedKeyframes } = this

        if (!element || !element.current) return

const value = element.getValue(name)
        value && value.jump(this.measuredOrigin, false)

        const finalKeyframeIndex = unresolvedKeyframes.length - 1
        const finalKeyframe = unresolvedKeyframes[finalKeyframeIndex]

unresolvedKeyframes[finalKeyframeIndex] = PositionalValues[name](
            element.measureViewportBox(),
            window.getComputedStyle(element.current)
        ) as any

        if (finalKeyframe !== null && this.finalKeyframe === undefined) {
            this.finalKeyframe = finalKeyframe as T
        }

        // If we removed transform values, reapply them before the next render
        if (this.removedTransforms?.length) {
            this.removedTransforms.forEach(
                ([unsetTransformName, unsetTransformValue]) => {
                    element
                        .getValue(unsetTransformName)!
                        .set(unsetTransformValue)
                }
            )
        }

        this.resolveNoneKeyframes()
    }
}
