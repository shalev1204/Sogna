"use client";
import { useConstant } from "../../utils/use-constant.js";
import { useUnmountEffect } from "../../utils/use-unmount-effect.js";
import { createScopedWaapiAnimate } from "../animators/waapi/animate-style.js";
export function useAnimateMini() {
    const scope = useConstant(() => ({
        current: null, // Will be hydrated by React
        animations: [],
    }));
    const animate = useConstant(() => createScopedWaapiAnimate(scope));
    useUnmountEffect(() => {
        scope.animations.forEach((animation) => animation.stop());
    });
    return [scope, animate];
}
//# sourceMappingURL=use-animate-style.js.map