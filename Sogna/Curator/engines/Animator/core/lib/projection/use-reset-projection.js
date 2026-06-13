import { useCallback } from "react";
import { rootProjectionNode } from "sognaflow-dom";
export function useResetProjection() {
    const reset = useCallback(() => {
        const root = rootProjectionNode.current;
        if (!root)
            return;
        root.resetTree();
    }, []);
    return reset;
}
//# sourceMappingURL=use-reset-projection.js.map