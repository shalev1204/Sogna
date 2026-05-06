import { pipe, warning } from "sognaflow-utils"
import { AnyResolvedKeyframe } from "../../animation/types.js"
import { IsCSSVariableToken } from "../../animation/utils/is-css-variable.js"
import { Color } from "../../value/types/color"
import {
    AnalyseComplexValue,
    Complex,
    ComplexValueInfo,
    ComplexValues,
} from "../../value/types/complex"
import { HSLA, RGBA } from "../../value/types/types.js"
import { MixColor } from "./color.js"
import { MixImmediate } from "./immediate.js"
import { MixNumber as MixNumberImmediate } from "./number.js"
import { invisibleValues, MixVisibility } from "./visibility.js"

type MixableArray = Array<number | RGBA | HSLA | string>
interface MixableObject {
    [key: string]: AnyResolvedKeyframe | RGBA | HSLA
}

function MixNumber(a: number, b: number) {
    return (p: number) => MixNumberImmediate(a, b, p)
}

export function GetMixer<T>(a: T) {
    if (typeof a === "number") {
        return MixNumber
    } else if (typeof a === "string") {
        return IsCSSVariableToken(a)
            ? MixImmediate
            : Color.test(a)
            ? MixColor
            : MixComplex
    } else if (Array.isArray(a)) {
        return MixArray
    } else if (typeof a === "object") {
        return Color.test(a) ? MixColor : MixObject
    }

    return MixImmediate
}

export function MixArray(a: MixableArray, b: MixableArray) {
    const output = [...a]
    const numValues = output.length

    const blendValue = a.map((v, i) => GetMixer(v)(v as any, b[i] as any))

    return (p: number) => {
        for (let i = 0; i < numValues; i++) {
            output[i] = blendValue[i](p) as any
        }
        return output
    }
}

export function MixObject(a: MixableObject, b: MixableObject) {
    const output = { ...a, ...b }
    const blendValue: { [key: string]: (v: number) => any } = {}

    for (const key in output) {
        if (a[key] !== undefined && b[key] !== undefined) {
            blendValue[key] = GetMixer(a[key])(
                a[key] as any,
                b[key] as any
            ) as any
        }
    }

    return (v: number) => {
        for (const key in blendValue) {
            output[key] = blendValue[key](v)
        }
        return output
    }
}

function matchOrder(
    origin: ComplexValueInfo,
    target: ComplexValueInfo
): ComplexValues {
    const orderedOrigin: ComplexValues = []

    const pointers = { color: 0, var: 0, number: 0 }

    for (let i = 0; i < target.values.length; i++) {
        const type = target.types[i]
        const originIndex = origin.indexes[type][pointers[type]]
        const originValue = origin.values[originIndex] ?? 0

        orderedOrigin[i] = originValue

        pointers[type]++
    }

    return orderedOrigin
}

export const MixComplex = (
    origin: AnyResolvedKeyframe,
    target: AnyResolvedKeyframe
) => {
    const template = Complex.createTransformer(target)
    const originStats = AnalyseComplexValue(origin)
    const targetStats = AnalyseComplexValue(target)
    const canInterpolate =
        originStats.indexes.var.length === targetStats.indexes.var.length &&
        originStats.indexes.color.length === targetStats.indexes.color.length &&
        originStats.indexes.number.length >= targetStats.indexes.number.length

    if (canInterpolate) {
        if (
            (invisibleValues.has(origin as string) &&
                !targetStats.values.length) ||
            (invisibleValues.has(target as string) &&
                !originStats.values.length)
        ) {
            return MixVisibility(origin as string, target as string)
        }

        return pipe(
            MixArray(matchOrder(originStats, targetStats), targetStats.values),
            template
        )
    } else {
        warning(
            true,
            `Complex values '${origin}' and '${target}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`,
            "complex-values-different"
        )

        return MixImmediate(origin, target)
    }
}
