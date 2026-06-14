"use client"

import { createContext } from "react"
import { CreateVisualElement } from "../render/types.js"

export interface LazyContextProps {
    renderer?: CreateVisualElement
    strict: boolean
}

export const LazyContext = createContext<LazyContextProps>({ strict: false })
