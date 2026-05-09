import { IsSVGElement } from "../utils/is-svg-element.js";
import { ResolveElements } from "../utils/resolve-elements.js";
const resizeHandlers = new WeakMap();
let observer;
const getSize = (borderBoxAxis, svgAxis, htmlAxis) => (target, borderBoxSize) => {
    if (borderBoxSize && borderBoxSize[0]) {
        return borderBoxSize[0][(borderBoxAxis + "Size")];
    }
    else if (IsSVGElement(target) && "getBBox" in target) {
        return target.getBBox()[svgAxis];
    }
    else {
        return target[htmlAxis];
    }
};
const getWidth = /*@__PURE__*/ getSize("inline", "width", "offsetWidth");
const getHeight = /*@__PURE__*/ getSize("block", "height", "offsetHeight");
function notifyTarget({ target, borderBoxSize }) {
    resizeHandlers.get(target)?.forEach((handler) => {
        handler(target, {
            get width() {
                return getWidth(target, borderBoxSize);
            },
            get height() {
                return getHeight(target, borderBoxSize);
            },
        });
    });
}
function notifyAll(entries) {
    entries.forEach(notifyTarget);
}
function createResizeObserver() {
    if (typeof ResizeObserver === "undefined")
        return;
    observer = new ResizeObserver(notifyAll);
}
export function ResizeElement(target, handler) {
    if (!observer)
        createResizeObserver();
    const elements = ResolveElements(target);
    elements.forEach((element) => {
        let elementHandlers = resizeHandlers.get(element);
        if (!elementHandlers) {
            elementHandlers = new Set();
            resizeHandlers.set(element, elementHandlers);
        }
        elementHandlers.add(handler);
        observer?.observe(element);
    });
    return () => {
        elements.forEach((element) => {
            const elementHandlers = resizeHandlers.get(element);
            elementHandlers?.delete(handler);
            if (!elementHandlers?.size) {
                observer?.unobserve(element);
            }
        });
    };
}
//# sourceMappingURL=handle-element.js.map
