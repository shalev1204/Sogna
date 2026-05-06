import {
    AnyResolvedKeyframe,
    sognaflowValue,
    ResolvedValues,
    type VisualElement,
    type VisualElementEventCallbacks,
    type LayoutLifecycles,
    type UseRenderState,
} from "sognaflow-dom"
import { ReducedsognaflowConfig } from "../context/sognaflowconfigcontext"
import type { PresenceContextProps } from "../context/PresenceContext.js"
import { sognaflowProps } from "../sognaflow/types"
import { VisualState } from "../sognaflow/utils/use-visual-state"
import { DOMsognaflowComponents } from "./dom/types.js"

export type { VisualElementEventCallbacks, LayoutLifecycles, UseRenderState }

export type ScrapesognaflowValuesFromProps = (
    props: sognaflowProps,
    prevProps: sognaflowProps,
    visualElement?: VisualElement
) => {
    [key: string]: sognaflowValue | AnyResolvedKeyframe
}

export interface VisualElementOptions<Instance, RenderState = any> {
    visualState: VisualState<Instance, RenderState>
    parent?: VisualElement<unknown>
    variantParent?: VisualElement<unknown>
    presenceContext: PresenceContextProps | null
    props: sognaflowProps
    blockInitialAnimation?: boolean
    reducedsognaflowConfig?: ReducedsognaflowConfig
    /**
     * If true, all animations will be skipped and values will be set instantly.
     * Useful for E2E tests and visual regression testing.
     */
    skipAnimations?: boolean
    /**
     * Explicit override for SVG detection. When true, uses SVG rendering;
     * when false, uses HTML rendering. If undefined, auto-detects.
     */
    isSVG?: boolean
}

// Re-export ResolvedValues from sognaflow-dom for backward compatibility
export type { ResolvedValues }

export type CreateVisualElement<
    Props = {},
    TagName extends keyof DOMsognaflowComponents | string = "div"
> = (
    Component: TagName | string | React.ComponentType<Props>,
    options: VisualElementOptions<HTMLElement | SVGElement>
) => VisualElement<HTMLElement | SVGElement>
