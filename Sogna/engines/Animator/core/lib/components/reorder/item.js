"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { issognaflowValue } from "sognaflow-dom";
import { invariant } from "sognaflow-utils";
import { forwardRef, useContext } from "react";
import { ReorderContext } from "../../context/reordercontext.js";
import { sognaflow } from "../../render/components/motion/proxy.js";
import { useConstant } from "../../utils/use-constant.js";
import { usesognaflowValue } from "../../value/use-sognaflow-value";
import { useTransform } from "../../value/use-transform.js";
import { autoScrollIfNeeded, resetAutoScrollState, } from "./utils/auto-scroll.js";
function useDefaultsognaflowValue(value, defaultValue = 0) {
    return issognaflowValue(value) ? value : usesognaflowValue(defaultValue);
}
export function ReorderItemComponent({ children, style = {}, value, as = "li", onDrag, onDragEnd, layout = true, ...props }, externalRef) {
    const Component = useConstant(() => sognaflow[as]);
    const context = useContext(ReorderContext);
    const point = {
        x: useDefaultsognaflowValue(style.x),
        y: useDefaultsognaflowValue(style.y),
    };
    const zIndex = useTransform([point.x, point.y], ([latestX, latestY]) => latestX || latestY ? 1 : "unset");
    invariant(Boolean(context), "Reorder.Item must be a child of Reorder.Group", "reorder-item-child");
    const { axis, registerItem, updateOrder, groupRef } = context;
    return (_jsx(Component, { drag: axis, ...props, dragSnapToOrigin: true, style: { ...style, x: point.x, y: point.y, zIndex }, layout: layout, onDrag: (event, gesturePoint) => {
            const { velocity, point: pointerPoint } = gesturePoint;
            const offset = point[axis].get();
            // Always attempt to update order - checkReorder handles the logic
            updateOrder(value, offset, velocity[axis]);
            autoScrollIfNeeded(groupRef.current, pointerPoint[axis], axis, velocity[axis]);
            onDrag && onDrag(event, gesturePoint);
        }, onDragEnd: (event, gesturePoint) => {
            resetAutoScrollState();
            onDragEnd && onDragEnd(event, gesturePoint);
        }, onLayoutMeasure: (measured) => {
            registerItem(value, measured);
        }, ref: externalRef, ignoreStrict: true, children: children }));
}
export const ReorderItem = /*@__PURE__*/ forwardRef(ReorderItemComponent);
//# sourceMappingURL=item.js.map