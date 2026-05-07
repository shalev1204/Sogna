import { ResolveElements, } from "../../utils/resolve-elements.js";
export function createSelectorEffect(subjectEffect) {
    return (subject, values) => {
        const elements = ResolveElements(subject);
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