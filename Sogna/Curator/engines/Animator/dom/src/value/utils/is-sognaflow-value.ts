import type { SognaflowValue } from ".."

export const IsSognaflowValue = (value: any): value is SognaflowValue =>
    Boolean(value && value.getVelocity)
