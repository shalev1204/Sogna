"use client"

import { createContext } from "react"
import type { NodeGroup } from "sognaflow-dom"

export interface LayoutGroupContextProps {
    id?: string
    group?: NodeGroup
    forceRender?: VoidFunction
}

export const LayoutGroupContext = createContext<LayoutGroupContextProps>({})
