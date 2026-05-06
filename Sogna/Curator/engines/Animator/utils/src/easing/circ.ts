import { mirrorEasing } from "./modifiers/mirror.js"
import { reverseEasing } from "./modifiers/reverse.js"
import { EasingFunction } from "./types.js"

export const circIn: EasingFunction = (p) => 1 - Math.sin(Math.acos(p))
export const circOut = reverseEasing(circIn)
export const circInOut = mirrorEasing(circIn)
