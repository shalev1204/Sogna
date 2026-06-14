import { Alpha, Scale } from "../numbers"
import { Degrees, ProgressPercentage, Px } from "../numbers/units.js"
import { ValueTypeMap } from "./types.js"

export const TransformValueTypes: ValueTypeMap = {
    rotate: Degrees,
    rotateX: Degrees,
    rotateY: Degrees,
    rotateZ: Degrees,
    scale: Scale,
    scaleX: Scale,
    scaleY: Scale,
    scaleZ: Scale,
    skew: Degrees,
    skewX: Degrees,
    skewY: Degrees,
    distance: Px,
    translateX: Px,
    translateY: Px,
    translateZ: Px,
    x: Px,
    y: Px,
    z: Px,
    perspective: Px,
    transformPerspective: Px,
    opacity: Alpha,
    originX: ProgressPercentage,
    originY: ProgressPercentage,
    originZ: Px,
}
