"use client"

import { useMemo } from "react"
import { AnimationScope } from "sognaflow-dom"
import { useConstant } from "../../utils/use-constant.js"
import { useUnmountEffect } from "../../utils/use-unmount-effect.js"
import { useReducedsognaflowConfig } from "../../utils/reduced-sognaflow/use-reduced-sognaflow-config"
import { createScopedAnimate } from "../animate"

export function useAnimate<T extends Element = any>() {
    const scope: AnimationScope<T> = useConstant(() => ({
        current: null!, // Will be hydrated by React
        animations: [],
    }))

    const reducesognaflow = useReducedsognaflowConfig() ?? undefined

    const animate = useMemo(
        () => createScopedAnimate({ scope, reducesognaflow }),
        [scope, reducesognaflow]
    )

    useUnmountEffect(() => {
        scope.animations.forEach((animation) => animation.stop())
        scope.animations.length = 0
    })

    return [scope, animate] as [AnimationScope<T>, typeof animate]
}
