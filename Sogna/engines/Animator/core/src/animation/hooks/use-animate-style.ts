"use client"

import { useConstant } from "../../utils/use-constant.js"
import { useUnmountEffect } from "../../utils/use-unmount-effect.js"
import { createScopedWaapiAnimate } from "../animators/waapi/animate-style.js"
import { AnimationScope } from "sognaflow-dom"

export function useAnimateMini<T extends Element = any>() {
    const scope: AnimationScope<T> = useConstant(() => ({
        current: null!, // Will be hydrated by React
        animations: [],
    }))

    const animate = useConstant(() => createScopedWaapiAnimate(scope))

    useUnmountEffect(() => {
        scope.animations.forEach((animation) => animation.stop())
    })

    return [scope, animate] as [AnimationScope<T>, typeof animate]
}
