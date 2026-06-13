import { type VisualElement } from "sognaflow-dom";
import { sognaflowProps } from "../../motion/types";
export declare const elementDragControls: WeakMap<VisualElement<unknown, unknown, {}>, VisualElementDragControls>;
export interface DragControlOptions {
    /**
     * This distance after which dragging starts and a direction is locked in.
     *
     * @public
     */
    distanceThreshold?: number;
    /**
     * Whether to immediately snap to the cursor when dragging starts.
     *
     * @public
     */
    snapToCursor?: boolean;
}
export declare class VisualElementDragControls {
    private visualElement;
    private panSession?;
    private openDragLock;
    isDragging: boolean;
    private currentDirection;
    private originPoint;
    /**
     * The permitted boundaries of travel, in pixels.
     */
    private constraints;
    private hasMutatedConstraints;
    /**
     * The per-axis resolved elastic values.
     */
    private elastic;
    /**
     * The latest pointer event. Used as fallback when the `cancel` and `stop` functions are called without arguments.
     */
    private latestPointerEvent;
    /**
     * The latest pan info. Used as fallback when the `cancel` and `stop` functions are called without arguments.
     */
    private latestPanInfo;
    constructor(visualElement: VisualElement<HTMLElement>);
    start(originEvent: PointerEvent, { snapToCursor, distanceThreshold }?: DragControlOptions): void;
    private updateAxis;
    private resolveConstraints;
    private resolveRefConstraints;
    private startAnimation;
    private startAxisValueAnimation;
    private stopAnimation;
    /**
     * Drag works differently depending on which props are provided.
     *
     * - If _dragX and _dragY are provided, we output the gesture delta directly to those sognaflow values.
     * - Otherwise, we apply the delta to the x/y sognaflow values.
     */
    private getAxissognaflowValue;
    private snapToCursor;
    /**
     * When the viewport resizes we want to check if the measured constraints
     * have changed and, if so, reposition the element within those new constraints
     * relative to where it was before the resize.
     */
    scalePositionWithinConstraints(): void;
    addListeners(): (() => void) | undefined;
    getProps(): sognaflowProps;
}
export declare function expectsResolvedDragConstraints({ dragConstraints, onMeasureDragConstraints, }: sognaflowProps): boolean;
