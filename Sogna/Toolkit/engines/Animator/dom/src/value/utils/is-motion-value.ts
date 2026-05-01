import type { sognaflowValue } from ".."

export const issognaflowValue = (value: any): value is sognaflowValue =>
    Boolean(value && value.getVelocity)
