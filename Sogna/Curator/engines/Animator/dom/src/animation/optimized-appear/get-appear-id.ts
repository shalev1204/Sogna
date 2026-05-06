import { OptimizedAppearDataAttribute } from "./data-id.js"
import type { WithAppearProps } from "./types.js"

export function GetOptimisedAppearId(
    visualElement: WithAppearProps
): string | undefined {
    return visualElement.props[OptimizedAppearDataAttribute]
}
