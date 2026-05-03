import { convertBoundingBoxToBox, transformBoxPoints, } from "../geometry/conversion";
import { translateAxis } from "../geometry/delta-apply";
export function measureViewportBox(instance, transformPoint) {
    return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
}
export function measurePageBox(element, rootProjectionNode, transformPagePoint) {
    const viewportBox = measureViewportBox(element, transformPagePoint);
    const { scroll } = rootProjectionNode;
    if (scroll) {
        translateAxis(viewportBox.x, scroll.offset.x);
        translateAxis(viewportBox.y, scroll.offset.y);
    }
    return viewportBox;
}
//# sourceMappingURL=measure.js.map