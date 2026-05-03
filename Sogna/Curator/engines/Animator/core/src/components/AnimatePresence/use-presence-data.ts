"use client"

import { useContext } from "react"
import { PresenceContext } from "../../context/presencecontext"

export function usePresenceData() {
    const context = useContext(PresenceContext)
    return context ? context.custom : undefined
}
