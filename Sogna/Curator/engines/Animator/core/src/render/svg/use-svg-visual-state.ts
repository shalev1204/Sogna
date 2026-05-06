"use client"

import { scrapeSVGsognaflowValuesFromProps } from "sognaflow-dom"
import { makeUseVisualState } from "../../sognaflow/utils/use-visual-state"
import { createSvgRenderState } from "./utils/create-render-state.js"

export const useSVGVisualState = /*@__PURE__*/ makeUseVisualState({
    scrapesognaflowValuesFromProps: scrapeSVGsognaflowValuesFromProps,
    createRenderState: createSvgRenderState,
})
