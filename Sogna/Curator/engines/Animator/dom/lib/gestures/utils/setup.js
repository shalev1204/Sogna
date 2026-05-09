import { ResolveElements, } from "../../utils/resolve-elements.js";
export function setupGesture(elementOrSelector, options) {
    const elements = ResolveElements(elementOrSelector);
    const gestureAbortController = new AbortController();
    const eventOptions = {
        passive: true,
        ...options,
        signal: gestureAbortController.signal,
    };
    const cancel = () => gestureAbortController.abort();
    return [elements, eventOptions, cancel];
}
//# sourceMappingURL=setup.js.map
