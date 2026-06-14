import {
    ElementOrSelector,
    ResolveElements,
} from "../../utils/resolve-elements.js"
import { EventOptions } from "../types.js"

export function setupGesture(
    elementOrSelector: ElementOrSelector,
    options: EventOptions
): [Element[], AddEventListenerOptions, VoidFunction] {
    const elements = ResolveElements(elementOrSelector)

    const gestureAbortController = new AbortController()

    const eventOptions = {
        passive: true,
        ...options,
        signal: gestureAbortController.signal,
    }

    const cancel = () => gestureAbortController.abort()

    return [elements, eventOptions, cancel]
}
