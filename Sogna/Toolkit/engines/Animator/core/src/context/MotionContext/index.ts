"use client"

import type { VisualElement } from "sognaflow-dom"
import { createContext } from "react"

export interface sognaflowContextProps<Instance = unknown> {
    visualElement?: VisualElement<Instance>
    initial?: false | string | string[]
    animate?: string | string[]
}

export const sognaflowContext = /* @__PURE__ */ createContext<sognaflowContextProps>(
    {}
)
