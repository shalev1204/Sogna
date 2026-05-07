"use client"

import { useContext } from "react"
import { sognaflowConfigContext } from "../../context/MotionConfigContext.js"
import { useReducedsognaflow } from "./use-reduced-sognaflow.js"

export function useReducedsognaflowConfig() {
    const reducedsognaflowPreference = useReducedsognaflow()
    const { reducedsognaflow } = useContext(sognaflowConfigContext) as any

    if (reducedsognaflow === "never") {
        return false
    } else if (reducedsognaflow === "always") {
        return true
    } else {
        return reducedsognaflowPreference
    }
}
