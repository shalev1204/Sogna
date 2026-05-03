import { GetMixer } from "./complex"
import { MixNumber as MixNumberImmediate } from "./number"
import { Mixer } from "./types"

export function Mix<T>(from: T, to: T): Mixer<T>
export function Mix(from: number, to: number, p: number): number
export function Mix<T>(from: T, to: T, p?: T): Mixer<T> | number {
    if (
        typeof from === "number" &&
        typeof to === "number" &&
        typeof p === "number"
    ) {
        return MixNumberImmediate(from, to, p)
    }

    const mixer = GetMixer(from)
    return mixer(from as any, to as any) as Mixer<T>
}
