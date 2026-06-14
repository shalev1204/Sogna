import { ValueAnimationOptions } from "../types.js"

export function MakeAnimationInstant(
    options: Partial<{
        duration: ValueAnimationOptions["duration"]
        type: ValueAnimationOptions["type"]
    }>
): void {
    options.duration = 0
    options.type = "keyframes"
}
