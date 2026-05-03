import { sognaflowProps } from "../types"

export function checkShouldInheritVariant({
    animate,
    variants,
    inherit,
}: sognaflowProps): boolean {
    return inherit !== undefined ? inherit : !!variants && !animate
}
