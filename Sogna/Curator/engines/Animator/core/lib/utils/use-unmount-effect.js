"use client";
import { useEffect } from "react";
export function useUnmountEffect(callback) {
    return useEffect(() => () => callback(), []);
}
//# sourceMappingURL=use-unmount-effect.js.map
