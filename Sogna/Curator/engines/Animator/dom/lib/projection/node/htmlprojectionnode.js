import { CreateProjectionNode } from "./create-projection-node.js";
import { DocumentProjectionNode } from "./documentprojectionnode.js";
export const rootProjectionNode = {
    current: undefined,
};
export const HTMLProjectionNode = CreateProjectionNode({
    measureScroll: (instance) => ({
        x: instance.scrollLeft,
        y: instance.scrollTop,
    }),
    defaultParent: () => {
        if (!rootProjectionNode.current) {
            const documentNode = new DocumentProjectionNode({});
            documentNode.mount(window);
            documentNode.setOptions({ layoutScroll: true });
            rootProjectionNode.current = documentNode;
        }
        return rootProjectionNode.current;
    },
    resetTransform: (instance, value) => {
        instance.style.transform = value !== undefined ? value : "none";
    },
    checkIsScrollRoot: (instance) => Boolean(window.getComputedStyle(instance).position === "fixed"),
});
//# sourceMappingURL=HTMLProjectionNode.js.map