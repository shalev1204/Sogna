"use client"

import { AnyResolvedKeyframe, buildHTMLStyles, isForcedsognaflowValue, issognaflowValue, sognaflowValue } from "sognaflow-dom"
import { HTMLProps, useMemo } from "react"
import { sognaflowProps } from "../../sognaflow/types"
import { ResolvedValues } from "../types.js"
import { createHtmlRenderState } from "./utils/create-render-state.js"

export function copyRawValuesOnly(
    target: ResolvedValues,
    source: { [key: string]: AnyResolvedKeyframe | sognaflowValue },
    props: sognaflowProps
) {
    for (const key in source) {
        if (!issognaflowValue(source[key]) && !isForcedsognaflowValue(key, props)) {
            target[key] = source[key] as AnyResolvedKeyframe
        }
    }
}

function useInitialsognaflowValues(
    { transformTemplate }: sognaflowProps,
    visualState: ResolvedValues
) {
    return useMemo(() => {
        const state = createHtmlRenderState()

        buildHTMLStyles(state, visualState, transformTemplate)

        return Object.assign({}, state.vars, state.style)
    }, [visualState])
}

function useStyle(
    props: sognaflowProps,
    visualState: ResolvedValues
): ResolvedValues {
    const styleProp = props.style || {}
    const style = {}

    /**
     * Copy non-sognaflow Values straight into style
     */
    copyRawValuesOnly(style, styleProp as any, props)

    Object.assign(style, useInitialsognaflowValues(props, visualState))

    return style
}

export function useHTMLProps(
    props: sognaflowProps & HTMLProps<HTMLElement>,
    visualState: ResolvedValues
) {
    // The `any` isn't ideal but it is the type of createElement props argument
    const htmlProps: any = {}
    const style = useStyle(props, visualState)

    if (props.drag && props.dragListener !== false) {
        // Disable the ghost element when a user drags
        htmlProps.draggable = false

        // Disable text selection
        style.userSelect =
            style.WebkitUserSelect =
            style.WebkitTouchCallout =
                "none"

        // Disable scrolling on the draggable direction
        style.touchAction =
            props.drag === true
                ? "none"
                : `pan-${props.drag === "x" ? "y" : "x"}`
    }

    if (
        props.tabIndex === undefined &&
        (props.onTap || props.onTapStart || props.whileTap)
    ) {
        htmlProps.tabIndex = 0
    }

    htmlProps.style = style

    return htmlProps
}
