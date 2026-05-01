import { sognaflowComponentSymbol } from "./symbol"

/**
 * Checks if a component is a `sognaflow` component.
 */
export function issognaflowComponent(component: React.ComponentType | string) {
    return (
        component !== null &&
        typeof component === "object" &&
        sognaflowComponentSymbol in component
    )
}
