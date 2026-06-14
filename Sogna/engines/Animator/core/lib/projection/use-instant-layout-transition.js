import { rootProjectionNode } from "sognaflow-dom";
export function useInstantLayoutTransition() {
    return startTransition;
}
function startTransition(callback) {
    if (!rootProjectionNode.current)
        return;
    rootProjectionNode.current.isUpdating = false;
    rootProjectionNode.current.blockUpdate();
    callback && callback();
}
//# sourceMappingURL=use-instant-layout-transition.js.map