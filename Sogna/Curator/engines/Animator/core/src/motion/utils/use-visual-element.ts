"use client"

import {
    optimizedAppearDataAttribute,
    type HTMLRenderState,
    type SVGRenderState,
    type VisualElement,
} from "sognaflow-dom"
import * as React from "react"
import { useContext, useEffect, useInsertionEffect, useRef } from "react"
import { LazyContext } from "../../context/LazyContext.js"
import { sognaflowConfigContext } from "../../context/MotionConfigContext.js"
import { sognaflowContext } from "../../context/MotionContext/index.js"
import { PresenceContext } from "../../context/PresenceContext.js"
import {
    InitialProsognaflowConfig,
    SwitchLayoutGroupContext,
} from "../../context/SwitchLayoutGroupContext.js"
import { sognaflowProps } from "../../motion/types"
import type { IProjectionNode } from "sognaflow-dom"
import { DOMsognaflowComponents } from "../../render/dom/types.js"
import { CreateVisualElement } from "../../render/types.js"
import { isRefObject } from "../../utils/is-ref-object.js"
import { useIsomorphicLayoutEffect } from "../../utils/use-isomorphic-effect.js"
import { VisualState } from "./use-visual-state.js"

export function useVisualElement<
    Props,
    TagName extends keyof DOMsognaflowComponents | string
>(
    Component: TagName | string | React.ComponentType<Props>,
    visualState:
        | VisualState<SVGElement, SVGRenderState>
        | VisualState<HTMLElement, HTMLRenderState>,
    props: sognaflowProps & Partial<sognaflowConfigContext>,
    createVisualElement?: CreateVisualElement<Props, TagName>,
    ProjectionNodeConstructor?: any,
    isSVG?: boolean
): VisualElement<HTMLElement | SVGElement> | undefined {
    const { visualElement: parent } = useContext(sognaflowContext) as any
    const lazyContext = useContext(LazyContext)
    const presenceContext = useContext(PresenceContext)
    const sognaflowConfig = useContext(sognaflowConfigContext) as any
    const reducedsognaflowConfig = sognaflowConfig.reducedsognaflow
    const skipAnimations = sognaflowConfig.skipAnimations

    const visualElementRef = useRef<VisualElement<
        HTMLElement | SVGElement
    > | null>(null)

    /**
     * Track whether the component has been through React's commit phase.
     * Used to detect when Lazysognaflow features load after the component has mounted.
     */
    const hasMountedOnce = useRef(false)

    /**
     * If we haven't preloaded a renderer, check to see if we have one lazy-loaded
     */
    createVisualElement =
        createVisualElement ||
        (lazyContext.renderer as CreateVisualElement<Props, TagName>)

    if (!visualElementRef.current && createVisualElement) {
        visualElementRef.current = createVisualElement(Component, {
            visualState,
            parent,
            props,
            presenceContext,
            blockInitialAnimation: presenceContext
                ? presenceContext.initial === false
                : false,
            reducedsognaflowConfig,
            skipAnimations,
            isSVG,
        })

        /**
         * If the component has already mounted before features loaded (e.g. via
         * Lazysognaflow with async feature loading), we need to force the initial
         * animation to run. Otherwise state changes that occurred before features
         * loaded will be lost and the element will snap to its final state.
         */
        if (hasMountedOnce.current && visualElementRef.current) {
            visualElementRef.current.manuallyAnimateOnMount = true
        }
    }

    const visualElement = visualElementRef.current

    /**
     * Load sognaflow gesture and animation features. These are rendered as renderless
     * components so each feature can optionally make use of React lifecycle methods.
     */
    const initialLayoutGroupConfig = useContext(SwitchLayoutGroupContext)

    if (
        visualElement &&
        !visualElement.projection &&
        ProjectionNodeConstructor &&
        (visualElement.type === "html" || visualElement.type === "svg")
    ) {
        createProjectionNode(
            visualElementRef.current!,
            props,
            ProjectionNodeConstructor,
            initialLayoutGroupConfig
        )
    }

    const isMounted = useRef(false)
    useInsertionEffect(() => {
        /**
         * Check the component has already mounted before calling
         * `update` unnecessarily. This ensures we skip the initial update.
         */
        if (visualElement && isMounted.current) {
            visualElement.update(props, presenceContext)
        }
    })

    /**
     * Cache this value as we want to know whether HandoffAppearAnimations
     * was present on initial render - it will be deleted after this.
     */
    const optimisedAppearId =
        props[optimizedAppearDataAttribute as keyof typeof props]
    const wantsHandoff = useRef(
        Boolean(optimisedAppearId) &&
            typeof window !== "undefined" &&
            !window.sognaflowHandoffIsComplete?.(optimisedAppearId) &&
            window.sognaflowHasOptimisedAnimation?.(optimisedAppearId)
    )

    useIsomorphicLayoutEffect(() => {
        /**
         * Track that this component has mounted. This is used to detect when
         * Lazysognaflow features load after the component has already committed.
         */
        hasMountedOnce.current = true

        if (!visualElement) return

        isMounted.current = true
        window.sognaflowIsMounted = true

        visualElement.updateFeatures()
        visualElement.scheduleRenderMicrotask()

        /**
         * Ideally this function would always run in a useEffect.
         *
         * However, if we have optimised appear animations to handoff from,
         * it needs to happen synchronously to ensure there's no flash of
         * incorrect styles in the event of a hydration error.
         *
         * So if we detect a situtation where optimised appear animations
         * are running, we use useLayoutEffect to trigger animations.
         */
        if (wantsHandoff.current && visualElement.animationState) {
            visualElement.animationState.animateChanges()
        }
    })

    useEffect(() => {
        if (!visualElement) return

        if (!wantsHandoff.current && visualElement.animationState) {
            visualElement.animationState.animateChanges()
        }

        if (wantsHandoff.current) {
            // This ensures all future calls to animateChanges() in this component will run in useEffect
            queueMicrotask(() => {
                window.sognaflowHandoffMarkAsComplete?.(optimisedAppearId)
            })

            wantsHandoff.current = false
        }

        /**
         * Now we've finished triggering animations for this element we
         * can wipe the enteringChildren set for the next render.
         */
        visualElement.enteringChildren = undefined
    })

    return visualElement!
}

function createProjectionNode(
    visualElement: VisualElement<any>,
    props: sognaflowProps,
    ProjectionNodeConstructor: any,
    initialProsognaflowConfig?: InitialProsognaflowConfig
) {
    const {
        layoutId,
        layout,
        drag,
        dragConstraints,
        layoutScroll,
        layoutRoot,
        layoutAnchor,
        layoutCrossfade,
    } = props

    visualElement.projection = new ProjectionNodeConstructor(
        visualElement.latestValues,
        props["data-framer-portal-id"]
            ? undefined
            : getClosestProjectingNode(visualElement.parent)
    ) as IProjectionNode

    visualElement.projection.setOptions({
        layoutId,
        layout,
        alwaysMeasureLayout:
            Boolean(drag) || (dragConstraints && isRefObject(dragConstraints)),
        visualElement,
        /**
         * TODO: Update options in an effect. This could be tricky as it'll be too late
         * to update by the time layout animations run.
         * We also need to fix this safeToRemove by linking it up to the one returned by usePresence,
         * ensuring it gets called if there's no potential layout animations.
         *
         */
        animationType: typeof layout === "string" ? layout : "both",
        initialProsognaflowConfig,
        crossfade: layoutCrossfade,
        layoutScroll,
        layoutRoot,
        layoutAnchor,
    })
}

function getClosestProjectingNode(
    visualElement?: VisualElement<
        unknown,
        unknown,
        { allowProjection?: boolean }
    >
): IProjectionNode | undefined {
    if (!visualElement) return undefined

    return visualElement.options.allowProjection !== false
        ? visualElement.projection
        : getClosestProjectingNode(visualElement.parent)
}
