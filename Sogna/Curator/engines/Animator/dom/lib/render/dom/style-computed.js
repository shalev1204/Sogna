import { IsCSSVar as isCSSVar } from "./is-css-var";
export function GetComputedStyle(element, name) {
    const computedStyle = window.getComputedStyle(element);
    return isCSSVar(name)
        ? computedStyle.getPropertyValue(name)
        : computedStyle[name];
}
//# sourceMappingURL=style-computed.js.map