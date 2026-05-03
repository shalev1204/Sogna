import { ResolveTransition } from "./resolve-transition";
export function GetValueTransition(transition, key) {
    const valueTransition = transition?.[key] ??
        transition?.["default"] ??
        transition;
    if (valueTransition !== transition) {
        return ResolveTransition(valueTransition, transition);
    }
    return valueTransition;
}
//# sourceMappingURL=get-value-transition.js.map