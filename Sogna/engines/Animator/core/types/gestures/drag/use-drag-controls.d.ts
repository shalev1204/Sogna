import * as React from "react";
import { DragControlOptions } from "./visualelementdragcontrols.js";
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
export declare class DragControls {
    private componentControls;
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
    start(event: React.PointerEvent | PointerEvent, options?: DragControlOptions): void;
    /**
     * Cancels a drag gesture.
     *
     * ```jsx
     * dragControls.cancel()
     * ```
     *
     * @public
     */
    cancel(): void;
    /**
     * Stops a drag gesture.
     *
     * ```jsx
     * dragControls.stop()
     * ```
     *
     * @public
     */
    stop(): void;
}
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
export declare function useDragControls(): DragControls;
