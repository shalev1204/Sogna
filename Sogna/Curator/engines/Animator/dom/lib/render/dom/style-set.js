import { isCSSVar } from "./is-css-var.js";
export function setStyle(element, name, value) {
isCSSVar(name)
? element.style.setProperty(name, value)
: (element.style[name] = value);
}
//# sourceMappingURL=style-set.js.map
