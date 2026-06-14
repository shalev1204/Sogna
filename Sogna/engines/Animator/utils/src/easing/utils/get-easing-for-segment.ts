import { wrap } from "../../wrap.js"
import { Easing } from "../types.js"
import { isEasingArray } from "./is-easing-array.js"

export function getEasingForSegment(
    easing: Easing | Easing[],
    i: number
): Easing {
    return isEasingArray(easing) ? easing[wrap(0, easing.length, i)] : easing
}
