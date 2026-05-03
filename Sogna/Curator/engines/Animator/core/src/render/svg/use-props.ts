"use client"

import { buildSVGAttrs, isSVGTag } from "sognaflow-dom"
import { useMemo } from "react"
import { sognaflowProps } from "../../sognaflow/types"
import { copyRawValuesOnly } from "../html/use-props"
import { ResolvedValues } from "../types"
import { createSvgRenderState } from "./utils/create-render-state"

export function useSVGProps(
    props: sognaflowProps,
    visualState: ResolvedValues,
    _isStatic: boolean,
    Component: string | React.ComponentType<React.PropsWithChildren<unknown>>
) {
    const visualProps = useMemo(() => {
        const state = createSvgRenderState()

        buildSVGAttrs(
            state,
            visualState,
            isSVGTag(Component),
            props.transformTemplate,
            props.style
        )

        return {
            ...state.attrs,
            style: { ...state.style },
        }
    }, [visualState])

    if (props.style) {
        const rawStyles = {}
        copyRawValuesOnly(rawStyles, props.style as any, props)
        visualProps.style = { ...rawStyles, ...visualProps.style }
    }

    return visualProps
}
