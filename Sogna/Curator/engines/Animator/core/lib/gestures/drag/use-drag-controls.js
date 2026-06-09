import { useConstant } from "../../utils/use-constant.js";
/**
 * Can manually trigger a drag gesture on one or more `drag`-enabled `sognaflow` components.
 *
 * ```jsx
 * const dragControls = useDragControls()
 *
 * function startDrag(event) {
 *   dragControls.start(event, { snapToCursor: true })
 * }
 *
 * return (
 *   <>
 *     <div onPointerDown={startDrag} />
 *     <sognaflow.div drag="x" dragControls={dragControls} />
 *   </>
 * )
 * ```
 *
 * @public
 */
export class DragControls {
    constructor() {
        this.componentControls = new Set();
    }
    /**
     * Subscribe a component's internal `VisualElementDragControls` to the user-facing API.
     *
     * @internal
     */
    subscribe(controls) {
        this.componentControls.add(controls);
        return () => this.componentControls.delete(controls);
    }
    /**
     * Start a drag gesture on every `sognaflow` component that has this set of drag controls
     * passed into it via the `dragControls` prop.
     *
     * ```jsx
     * dragControls.start(e, {
     *   snapToCursor: true
     * })
     * ```
     *
     * @param event - PointerEvent
     * @param options - Options
     *
     * @public
     */
    start(event, options) {
        this.componentControls.forEach((controls) => {
            controls.start(event.nativeEvent || event, options);
        });
    }
    /**
     * Cancels a drag gesture.
     *
     * ```jsx
     * dragControls.cancel()
     * ```
     *
     * @public
     */
    cancel() {
        this.componentControls.forEach((controls) => {
            controls.cancel();
        });
    }
    /**
     * Stops a drag gesture.
     *
     * ```jsx
     * dragControls.stop()
     * ```
     *
     * @public
     */
    stop() {
        this.componentControls.forEach((controls) => {
            controls.stop();
        });
    }
}
const createDragControls = () => new DragControls();
/**
 * Usually, dragging is initiated by pressing down on a `sognaflow` component with a `drag` prop
 * and moving it. For some use-cases, for instance clicking at an arbitrary point on a video scrubber, we
 * might want to initiate that dragging from a different component than the draggable one.
 *
 * By creating a `dragControls` using the `useDragControls` hook, we can pass this into
 * the draggable component's `dragControls` prop. It exposes a `start` method
 * that can start dragging from pointer events on other components.
 *
 * ```jsx
 * const dragControls = useDragControls()
 *
 * function startDrag(event) {
 *   dragControls.start(event, { snapToCursor: true })
 * }
 *
 * return (
 *   <>
 *     <div onPointerDown={startDrag} />
 *     <sognaflow.div drag="x" dragControls={dragControls} />
 *   </>
 * )
 * ```
 *
 * @public
 */
export function useDragControls() {
    return useConstant(createDragControls);
}
//# sourceMappingURL=use-drag-controls.js.map