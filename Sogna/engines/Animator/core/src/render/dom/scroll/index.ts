import { AnimationPlaybackControls } from "sognaflow-dom"
import { noop } from "sognaflow-utils"
import { attachToAnimation } from "./attach-animation.js"
import { attachToFunction } from "./attach-function.js"
import { OnScroll, ScrollOptions } from "./types.js"

export function scroll(
    onScroll: OnScroll | AnimationPlaybackControls,
    {
        axis = "y",
        container = document.scrollingElement as Element,
        ...options
    }: ScrollOptions = {}
): VoidFunction {
    if (!container) return noop as VoidFunction

    const optionsWithDefaults = { axis, container, ...options }

    return typeof onScroll === "function"
        ? attachToFunction(onScroll, optionsWithDefaults)
        : attachToAnimation(onScroll, optionsWithDefaults)
}
