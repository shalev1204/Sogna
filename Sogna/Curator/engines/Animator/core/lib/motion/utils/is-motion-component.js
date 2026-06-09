import { sognaflowComponentSymbol } from "./symbol.js";
/**
 * Checks if a component is a `sognaflow` component.
 */
export function issognaflowComponent(component) {
    return (component !== null &&
        typeof component === "object" &&
        sognaflowComponentSymbol in component);
}
export const isMotionComponent = issognaflowComponent;
//# sourceMappingURL=is-motion-component.js.map