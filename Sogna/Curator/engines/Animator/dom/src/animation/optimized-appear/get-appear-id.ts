import { OptimizedAppearDataAttribute } from "./data-id"
import type { WithAppearProps } from "./types"

export function GetOptimisedAppearId(
    visualElement: WithAppearProps
): string | undefined {
    return visualElement.props[OptimizedAppearDataAttribute]
}
