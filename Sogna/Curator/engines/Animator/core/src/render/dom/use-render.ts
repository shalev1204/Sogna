"use client"

import { issognaflowValue } from "sognaflow-dom"
import { Fragment, createElement, useMemo } from "react"
import { sognaflowProps } from "../../sognaflow/types"
import { VisualState } from "../../sognaflow/utils/use-visual-state"
import { HTMLRenderState } from "../html/types"
import { useHTMLProps } from "../html/use-props"
import { SVGRenderState } from "../svg/types"
import { useSVGProps } from "../svg/use-props"
import { DOMsognaflowComponents } from "./types"
import { filterProps } from "./utils/filter-props"
import { isSVGComponent } from "./utils/is-svg-component"

export function useRender<
    Props = {},
    TagName extends keyof DOMsognaflowComponents | string = "div"
>(
    Component: TagName | string | React.ComponentType<Props>,
    props: sognaflowProps,
    ref: React.Ref<HTMLElement | SVGElement>,
    {
        latestValues,
    }: VisualState<HTMLElement | SVGElement, HTMLRenderState | SVGRenderState>,
    isStatic: boolean,
    forwardsognaflowProps: boolean = false,
    isSVG?: boolean
) {
    const useVisualProps =
        (isSVG ?? isSVGComponent(Component)) ? useSVGProps : useHTMLProps

    const visualProps = useVisualProps(
        props as any,
        latestValues,
        isStatic,
        Component as any
    )
    const filteredProps = filterProps(
        props,
        typeof Component === "string",
        forwardsognaflowProps
    )
    const elementProps =
        Component !== Fragment ? { ...filteredProps, ...visualProps, ref } : {}

    /**
     * If component has been handed a sognaflow value as its child,
     * memoise its initial value and render that. Subsequent updates
     * will be handled by the onChange handler
     */
    const { children } = props
    const renderedChildren = useMemo(
        () => (issognaflowValue(children) ? children.get() : children),
        [children]
    )

    return createElement<any>(Component, {
        ...elementProps,
        children: renderedChildren,
    })
}
