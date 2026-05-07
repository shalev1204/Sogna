export function isDraggable(visualElement) {
    const { drag, _dragX } = visualElement.getProps();
    return drag && !_dragX;
}
//# sourceMappingURL=is-draggable.js.map