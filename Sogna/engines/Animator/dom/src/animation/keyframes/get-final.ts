import { AnimationPlaybackOptions } from "../types.js"

const isNotNull = (value: unknown) => value !== null

export function GetFinalKeyframe<T>(
    keyframes: T[],
    { repeat, repeatType = "loop" }: AnimationPlaybackOptions,
    finalKeyframe?: T,
    speed: number = 1
): T {
    const resolvedKeyframes = keyframes.filter(isNotNull)
    const useFirstKeyframe =
        speed < 0 || (repeat && repeatType !== "loop" && repeat % 2 === 1)
    const index = useFirstKeyframe ? 0 : resolvedKeyframes.length - 1

    return !index || finalKeyframe === undefined
        ? resolvedKeyframes[index]
        : finalKeyframe
}

export const getFinalKeyframe = GetFinalKeyframe

