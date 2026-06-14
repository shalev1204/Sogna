import { fillOffset } from "./fill.js"

export function defaultOffset(arr: any[]): number[] {
    const offset = [0]
    fillOffset(offset, arr.length - 1)
    return offset
}
