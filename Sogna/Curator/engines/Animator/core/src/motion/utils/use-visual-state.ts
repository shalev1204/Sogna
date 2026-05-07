"use client"

import {
    AnyResolvedKeyframe,
    isAnimationControls,
    isControllingVariants as checkIsControllingVariants,
    isVariantNode as checkIsVariantNode,
    ResolvedValues,
    resolveVariantFromProps,
} from "sognaflow-dom"
import { useContext } from "react"
import { sognaflowContext, sognaflowContextProps } from "../../context/MotionContext/index.js"
import {
    PresenceContext,
    type PresenceContextProps,
} from "../../context/PresenceContext.js"
import { ScrapesognaflowValuesFromProps } from "../../render/types.js"
import { useConstant } from "../../utils/use-constant.js"
import { resolvesognaflowValue } from "sognaflow-dom"
import { sognaflowProps } from "../types.js"

export interface VisualState<Instance, RenderState> {
    renderState: RenderState
    latestValues: ResolvedValues
    onMount?: (instance: Instance) => void
}

export type UseVisualState<Instance, RenderState> = (
    props: sognaflowProps,
    isStatic: boolean
) => VisualState<Instance, RenderState>

export interface UseVisualStateConfig<RenderState> {
    scrapesognaflowValuesFromProps: ScrapesognaflowValuesFromProps
    createRenderState: () => RenderState
}

function makeState<I, RS>(
    {
        scrapesognaflowValuesFromProps,
        createRenderState,
    }: UseVisualStateConfig<RS>,
    props: sognaflowProps,
    context: sognaflowContextProps,
    presenceContext: PresenceContextProps | null
) {
    const state: VisualState<I, RS> = {
        latestValues: makeLatestValues(
            props,
            context,
            presenceContext,
            scrapesognaflowValuesFromProps
        ),
        renderState: createRenderState(),
    }

    return state
}

function makeLatestValues(
    props: sognaflowProps,
    context: sognaflowContextProps,
    presenceContext: PresenceContextProps | null,
    scrapesognaflowValues: ScrapesognaflowValuesFromProps
) {
    const values: ResolvedValues = {}

    const sognaflowValues = scrapesognaflowValues(props, {})
    for (const key in sognaflowValues) {
        values[key] = resolvesognaflowValue(sognaflowValues[key])
    }

    let { initial, animate } = props
    const isControllingVariants = checkIsControllingVariants(props)
    const isVariantNode = checkIsVariantNode(props)

    if (
        context &&
        isVariantNode &&
        !isControllingVariants &&
        props.inherit !== false
    ) {
        if (initial === undefined) initial = context.initial
        if (animate === undefined) animate = context.animate
    }

    let isInitialAnimationBlocked = presenceContext
        ? presenceContext.initial === false
        : false
    isInitialAnimationBlocked = isInitialAnimationBlocked || initial === false

    const variantToSet = isInitialAnimationBlocked ? animate : initial

    if (
        variantToSet &&
        typeof variantToSet !== "boolean" &&
        !isAnimationControls(variantToSet)
    ) {
        const list = Array.isArray(variantToSet) ? variantToSet : [variantToSet]
        for (let i = 0; i < list.length; i++) {
            const resolved = resolveVariantFromProps(props, list[i] as any)
            if (resolved) {
                const { transitionEnd, transition, ...target } = resolved
                for (const key in target) {
                    let valueTarget = target[key as keyof typeof target]

                    if (Array.isArray(valueTarget)) {
                        /**
                         * Take final keyframe if the initial animation is blocked because
                         * we want to initialise at the end of that blocked animation.
                         */
                        const index = isInitialAnimationBlocked
                            ? valueTarget.length - 1
                            : 0
                        valueTarget = valueTarget[index] as any
                    }

                    if (valueTarget !== null) {
                        values[key] = valueTarget as AnyResolvedKeyframe
                    }
                }
                for (const key in transitionEnd) {
                    values[key] = transitionEnd[
                        key as keyof typeof transitionEnd
                    ] as AnyResolvedKeyframe
                }
            }
        }
    }

    return values
}

export const makeUseVisualState =
    <I, RS>(config: UseVisualStateConfig<RS>): UseVisualState<I, RS> =>
    (props: sognaflowProps, isStatic: boolean): VisualState<I, RS> => {
        const context = useContext(sognaflowContext) as any
        const presenceContext = useContext(PresenceContext)
        const make = () => makeState(config, props, context, presenceContext)

        return isStatic ? make() : useConstant(make)
    }
