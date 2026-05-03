import { ResolveTransition } from "./resolve-transition"

export function GetValueTransition(transition: any, key: string) {
    const valueTransition =
        transition?.[key as keyof typeof transition] ??
        transition?.["default"] ??
        transition

    if (valueTransition !== transition) {
        return ResolveTransition(valueTransition, transition)
    }

    return valueTransition
}
