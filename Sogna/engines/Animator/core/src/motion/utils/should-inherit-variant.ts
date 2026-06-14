import { sognaflowProps } from "../types.js"

export function checkShouldInheritVariant({
    animate,
    variants,
    inherit,
}: sognaflowProps): boolean {
    return inherit !== undefined ? inherit : !!variants && !animate
}
