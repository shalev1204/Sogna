"use client"

import { useAnimationFrame } from "../utils/use-animation-frame.js"
import { usesognaflowValue } from "./use-sognaflow-value"

export function useTime() {
    const time = usesognaflowValue(0)
    useAnimationFrame((t) => time.set(t))
    return time
}
