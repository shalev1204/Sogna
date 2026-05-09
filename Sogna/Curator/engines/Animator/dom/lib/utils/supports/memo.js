import { memo } from "sognaflow-utils";
import { supportsFlags } from "./flags.js";
export function memoSupports(callback, supportsFlag) {
    const memoized = memo(callback);
    return () => supportsFlags[supportsFlag] ?? memoized();
}
//# sourceMappingURL=memo.js.map
