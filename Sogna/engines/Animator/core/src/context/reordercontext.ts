"use client"

import { createContext } from "react"
import { ReorderContextProps } from "../components/reorder/types.js"

export const ReorderContext = createContext<ReorderContextProps<any> | null>(
    null
)
