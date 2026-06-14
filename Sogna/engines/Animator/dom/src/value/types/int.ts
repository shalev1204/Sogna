import { NumberType } from "./numbers"

export const Int = {
    ...NumberType,
    transform: Math.round,
}
