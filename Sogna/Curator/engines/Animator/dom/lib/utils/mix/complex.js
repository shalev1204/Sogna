import { pipe, warning } from "sognaflow-utils";
import { IsCSSVariableToken } from "../../animation/utils/is-css-variable.js";
import { Color } from "../../value/types/color";
import { AnalyseComplexValue, Complex, } from "../../value/types/complex";
import { MixColor } from "./color.js";
import { MixImmediate } from "./immediate.js";
import { MixNumber as MixNumberImmediate } from "./number.js";
import { invisibleValues, MixVisibility } from "./visibility.js";
function MixNumber(a, b) {
    return (p) => MixNumberImmediate(a, b, p);
}
export function GetMixer(a) {
    if (typeof a === "number") {
        return MixNumber;
    }
    else if (typeof a === "string") {
        return IsCSSVariableToken(a)
            ? MixImmediate
            : Color.test(a)
                ? MixColor
                : MixComplex;
    }
    else if (Array.isArray(a)) {
        return MixArray;
    }
    else if (typeof a === "object") {
        return Color.test(a) ? MixColor : MixObject;
    }
    return MixImmediate;
}
export function MixArray(a, b) {
    const output = [...a];
    const numValues = output.length;
    const blendValue = a.map((v, i) => GetMixer(v)(v, b[i]));
    return (p) => {
        for (let i = 0; i < numValues; i++) {
            output[i] = blendValue[i](p);
        }
        return output;
    };
}
export function MixObject(a, b) {
    const output = { ...a, ...b };
    const blendValue = {};
    for (const key in output) {
        if (a[key] !== undefined && b[key] !== undefined) {
            blendValue[key] = GetMixer(a[key])(a[key], b[key]);
        }
    }
    return (v) => {
        for (const key in blendValue) {
            output[key] = blendValue[key](v);
        }
        return output;
    };
}
function matchOrder(origin, target) {
    const orderedOrigin = [];
    const pointers = { color: 0, var: 0, number: 0 };
    for (let i = 0; i < target.values.length; i++) {
        const type = target.types[i];
        const originIndex = origin.indexes[type][pointers[type]];
        const originValue = origin.values[originIndex] ?? 0;
        orderedOrigin[i] = originValue;
        pointers[type]++;
    }
    return orderedOrigin;
}
export const MixComplex = (origin, target) => {
    const template = Complex.createTransformer(target);
    const originStats = AnalyseComplexValue(origin);
    const targetStats = AnalyseComplexValue(target);
    const canInterpolate = originStats.indexes.var.length === targetStats.indexes.var.length &&
        originStats.indexes.color.length === targetStats.indexes.color.length &&
        originStats.indexes.number.length >= targetStats.indexes.number.length;
    if (canInterpolate) {
        if ((invisibleValues.has(origin) &&
            !targetStats.values.length) ||
            (invisibleValues.has(target) &&
                !originStats.values.length)) {
            return MixVisibility(origin, target);
        }
        return pipe(MixArray(matchOrder(originStats, targetStats), targetStats.values), template);
    }
    else {
        warning(true, `Complex values '${origin}' and '${target}' too different to mix. Ensure all colors are of the same type, and that each contains the same quantity of number and color values. Falling back to instant transition.`, "complex-values-different");
        return MixImmediate(origin, target);
    }
};
//# sourceMappingURL=complex.js.map