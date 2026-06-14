import { isValidElement, Children } from "react";
export const getChildKey = (child) => child.key || "";
export function onlyElements(children) {
    const filtered = [];
    // We use forEach here instead of map as map mutates the component key by preprending `.$`
    Children.forEach(children, (child) => {
        if (isValidElement(child))
            filtered.push(child);
    });
    return filtered;
}
//# sourceMappingURL=utils.js.map