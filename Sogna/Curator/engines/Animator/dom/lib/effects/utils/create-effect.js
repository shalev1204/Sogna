import { SognaflowValueState } from "../sognaflowvaluestate";
export function CreateEffect(addValue) {
    const stateCache = new WeakMap();
    return (subject, values) => {
        const state = stateCache.get(subject) ?? new SognaflowValueState();
        stateCache.set(subject, state);
        const subscriptions = [];
        for (const key in values) {
            const value = values[key];
            const remove = addValue(subject, state, key, value);
            subscriptions.push(remove);
        }
        return () => {
            for (const cancel of subscriptions)
                cancel();
        };
    };
}
//# sourceMappingURL=create-effect.js.map