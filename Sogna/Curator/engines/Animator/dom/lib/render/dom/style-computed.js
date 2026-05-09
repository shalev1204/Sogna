import { isCSSVar } from "./is-css-var.js";
export function getComputedStyle(element, name) {
    const computedStyle = window.getComputedStyle(element);
return isCSSVar(name)
? computedStyle.getPropertyValue(name)
: computedStyle[name];
}
//# sourceMappingURL=style-computed.js.map
