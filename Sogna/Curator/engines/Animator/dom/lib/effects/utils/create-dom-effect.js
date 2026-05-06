import { ResolveElements as resolveElements, } from "../../utils/resolve-elements.js";
export function CreateSelectorEffect(subjectEffect) {
    return (subject, values) => {
        const elements = resolveElements(subject);
        const subscriptions = [];
        for (const element of elements) {
            const remove = subjectEffect(element, values);
            subscriptions.push(remove);
        }
        return () => {
            for (const remove of subscriptions)
                remove();
        };
    };
}
//# sourceMappingURL=create-dom-effect.js.map