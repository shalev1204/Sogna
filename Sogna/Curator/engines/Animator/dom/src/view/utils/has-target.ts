import { ViewTransitionTarget, ViewTransitionTargetDefinition } from "../types"

export function HasTarget(
    target: ViewTransitionTargetDefinition,
    targets: Map<ViewTransitionTargetDefinition, ViewTransitionTarget>
) {
    return targets.has(target) && Object.keys(targets.get(target)!).length > 0
}
