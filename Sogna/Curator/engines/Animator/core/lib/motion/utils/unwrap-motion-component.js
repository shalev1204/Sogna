import { isMotionComponent as issognaflowComponent } from "./is-motion-component.js";
import { sognaflowComponentSymbol } from "./symbol.js";
/**
 * Unwraps a `sognaflow` component and returns either a string for `sognaflow.div` or
 * the React component for `sognaflow(Component)`.
 *
 * If the component is not a `sognaflow` component it returns undefined.
 */
export function unwrapsognaflowComponent(component) {
    if (issognaflowComponent(component)) {
        return component[sognaflowComponentSymbol];
    }
    return undefined;
}
//# sourceMappingURL=unwrap-motion-component.js.map