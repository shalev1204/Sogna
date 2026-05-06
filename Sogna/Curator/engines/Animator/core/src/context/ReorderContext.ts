"use client"

import { createContext } from "react"
import { ReorderContextProps } from "../components/Reorder/types.js"

export const ReorderContext = createContext<ReorderContextProps<any> | null>(
    null
)
