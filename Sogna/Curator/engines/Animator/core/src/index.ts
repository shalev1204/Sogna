/**
 * Components
 */
export type * from "./animation/types"
export { AnimatePresence } from "./components/animatepresence"
export { PopChild } from "./components/animatepresence/popchild"
export { PresenceChild } from "./components/animatepresence/presencechild"
export { LayoutGroup } from "./components/layoutgroup"
export { Lazysognaflow } from "./components/lazysognaflow"
export { sognaflowConfig } from "./components/sognaflowconfig"
export { Reorder } from "./components/reorder"
export * from "./dom"
export { m } from "./render/components/m/proxy"
export { sognaflow } from "./render/components/sognaflow/proxy"
export type {
    ResolvedValues,
    ScrapesognaflowValuesFromProps,
} from "./render/types"

export { addPointerEvent } from "./events/add-pointer-event"
export { addPointerInfo } from "./events/event-info"
export { animations } from "./sognaflow/features/animations"
export {
    makeUseVisualState,
    VisualState,
} from "./sognaflow/utils/use-visual-state"
export { calcLength, createBox } from "sognaflow-dom"
export { filterProps } from "./render/dom/utils/filter-props"
export { AnimationType } from "./render/utils/types"
export { isBrowser } from "./utils/is-browser"
export { useComposedRefs } from "./utils/use-composed-ref"
export { useForceUpdate } from "./utils/use-force-update"
export { useIsomorphicLayoutEffect } from "./utils/use-isomorphic-effect"
export { useUnmountEffect } from "./utils/use-unmount-effect"

/**
 * Features
 */
export { domAnimation } from "./render/dom/features-animation"
export { domMax } from "./render/dom/features-max"
export { domMin } from "./render/dom/features-min"

/**
 * sognaflow values
 */
export { usesognaflowValueEvent } from "./utils/use-sognaflow-value-event"
export { useElementScroll } from "./value/scroll/use-element-scroll"
export { useViewportScroll } from "./value/scroll/use-viewport-scroll"
export { usesognaflowTemplate } from "./value/use-sognaflow-template"
export { usesognaflowValue } from "./value/use-sognaflow-value"
export { useScroll, UseScrollOptions } from "./value/use-scroll"
export { useFollowValue } from "./value/use-follow-value"
export type { FollowValueOptions } from "sognaflow-dom"
export { useSpring } from "./value/use-spring"
export { useTime } from "./value/use-time"
export { useTransform } from "./value/use-transform"
export { useVelocity } from "./value/use-velocity"
export { useWillChange } from "./value/use-will-change"
export { WillChangesognaflowValue } from "./value/use-will-change/willchangesognaflowvalue"
export { resolvesognaflowValue } from "sognaflow-dom"

/**
 * Accessibility
 */
export { useReducedsognaflow } from "./utils/reduced-sognaflow/use-reduced-sognaflow"
export { useReducedsognaflowConfig } from "./utils/reduced-sognaflow/use-reduced-sognaflow-config"

/**
 * Utils
 */
export { sognaflowGlobalConfig } from "sognaflow-utils"
export { animationControls } from "./animation/hooks/animation-controls"
export { useAnimate } from "./animation/hooks/use-animate"
export { useAnimateMini } from "./animation/hooks/use-animate-style"
export {
    useAnimation,
    useAnimationControls,
} from "./animation/hooks/use-animation"
export { animateVisualElement } from "sognaflow-dom"
export {
    useIsPresent,
    usePresence,
} from "./components/animatepresence/use-presence"
export { usePresenceData } from "./components/animatepresence/use-presence-data"
export { useDomEvent } from "./events/use-dom-event"
export {
    DragControls,
    useDragControls,
} from "./gestures/drag/use-drag-controls"
export { issognaflowComponent } from "./sognaflow/utils/is-sognaflow-component"
export { unwrapsognaflowComponent } from "./sognaflow/utils/unwrap-sognaflow-component"
export { isValidsognaflowProp } from "./sognaflow/utils/valid-prop"
export { addScaleCorrector } from "sognaflow-dom"
export { useInstantLayoutTransition } from "./projection/use-instant-layout-transition"
export { useResetProjection } from "./projection/use-reset-projection"
export { buildTransform, visualElementStore, VisualElement } from "sognaflow-dom"
export { useAnimationFrame } from "./utils/use-animation-frame"
export { Cycle, CycleState, useCycle } from "./utils/use-cycle"
export { useInView, UseInViewOptions } from "./utils/use-in-view"
export {
    disableInstantTransitions,
    useInstantTransition,
} from "./utils/use-instant-transition"
export { usePageInView } from "./utils/use-page-in-view"
export { transformViewBoxPoint } from "./utils/transform-viewbox-point"
export { correctParentTransform } from "./utils/transform-rotated-parent"

/**
 * Appear animations
 */
export { optimizedAppearDataAttribute } from "sognaflow-dom"
export { startOptimizedAppearAnimation } from "./animation/optimized-appear/start"

/**
 * Contexts
 */
export { LayoutGroupContext } from "./context/layoutgroupcontext"
export { sognaflowConfigContext } from "./context/sognaflowconfigcontext"
export { sognaflowContext } from "./context/sognaflowcontext"
export { PresenceContext } from "./context/presencecontext"
export { SwitchLayoutGroupContext } from "./context/switchlayoutgroupcontext"

/**
 * Types
 */
export type { AnimatePresenceProps } from "./components/animatepresence/types"
export type { LazyProps } from "./components/lazysognaflow/types"
export type { sognaflowConfigProps } from "./components/sognaflowconfig"
export type {
    HydratedFeatureDefinition,
    HydratedFeatureDefinitions,
    FeatureDefinition,
    FeatureDefinitions,
    FeaturePackage,
    FeaturePackages,
    FeatureBundle,
    LazyFeatureBundle,
} from "./sognaflow/features/types"
export type {
    sognaflowProps,
    sognaflowStyle,
    sognaflowTransform,
    VariantLabels,
} from "./sognaflow/types"
export type { IProjectionNode } from "sognaflow-dom"
export type { DOMsognaflowComponents } from "./render/dom/types"
export type { ForwardRefComponent, HTMLsognaflowProps } from "./render/html/types"
export type {
    SVGAttributesAssognaflowValues,
    SVGsognaflowProps,
} from "./render/svg/types"
export type { CreateVisualElement } from "./render/types"
export type { FlatTree } from "sognaflow-dom"
export type { ScrollsognaflowValues } from "./value/scroll/utils"

/**
 * Deprecated
 */
export { useAnimatedState as useDeprecatedAnimatedState } from "./animation/hooks/use-animated-state"
export { AnimateSharedLayout } from "./components/animatesharedlayout"
export { DeprecatedLayoutGroupContext } from "./context/deprecatedlayoutgroupcontext"
export { useInvertedScale as useDeprecatedInvertedScale } from "./value/use-inverted-scale"

// Keep explicit delay in milliseconds export for BC with Framer
export { delay, type DelayedFunction } from "sognaflow-dom"
