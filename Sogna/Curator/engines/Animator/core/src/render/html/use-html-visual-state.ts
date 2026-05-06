"use client"

import { scrapeHTMLsognaflowValuesFromProps } from "sognaflow-dom"
import { makeUseVisualState } from "../../sognaflow/utils/use-visual-state"
import { createHtmlRenderState } from "./utils/create-render-state.js"

export const useHTMLVisualState = /*@__PURE__*/ makeUseVisualState({
    scrapesognaflowValuesFromProps: scrapeHTMLsognaflowValuesFromProps,
    createRenderState: createHtmlRenderState,
})
