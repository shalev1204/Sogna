"use client";
import { useFollowValue } from "./use-follow-value.js";
export function useSpring(source, options = {}) {
    return useFollowValue(source, { type: "spring", ...options });
}
//# sourceMappingURL=use-spring.js.map