import { Axis, AxisDelta, Box, Delta, Point, SubscriptionManager } from "sognaflow-utils";
import { JSAnimation } from "../../animation/jsanimation.js";
import { Transition, ValueAnimationOptions } from "../../animation/types.js";
import type { Process } from "../../frameloop/types.js";
import type { ResolvedValues } from "../../render/types.js";
import type { SognaflowStyle } from "../../render/visualelement.js";
import { SognaflowValue } from "../../value";
import { NodeStack } from "../shared/stack.js";
import { FlatTree } from "../utils/flat-tree.js";
import { IProjectionNode, LayoutEvents, Measurements, Phase, ProjectionNodeConfig, ProjectionNodeOptions, ScrollMeasurements } from "./types.js";
export declare function CreateProjectionNode<I>({ attachResizeListener, defaultParent, measureScroll, checkIsScrollRoot, resetTransform, }: ProjectionNodeConfig<I>): {
    new (latestValues?: ResolvedValues, parent?: IProjectionNode | undefined): {
        /**
         * A unique ID generated for every projection node.
         */
        id: number;
        /**
         * An id that represents a unique session instigated by startUpdate.
         */
        animationId: number;
        animationCommitId: number;
        /**
         * A reference to the platform-native node (currently this will be a HTMLElement).
         */
        instance: I | undefined;
        /**
         * A reference to the root projection node. There'll only ever be one tree and one root.
         */
        root: IProjectionNode;
        /**
         * A reference to this node's parent.
         */
        parent?: IProjectionNode;
        /**
         * A path from this node to the root node. This provides a fast way to iterate
         * back up the tree.
         */
        path: IProjectionNode[];
        /**
         * A Set containing all this component's children. This is used to iterate
         * through the children.
         *
         * TODO: This could be faster to iterate as a flat array stored on the root node.
         */
        children: Set<IProjectionNode<unknown>>;
        /**
         * Options for the node. We use this to configure what kind of layout animations
         * we should perform (if any).
         */
        options: ProjectionNodeOptions;
        /**
         * A snapshot of the element's state just before the current update. This is
         * hydrated when this node's `willUpdate` method is called and scrubbed at the
         * end of the tree's `didUpdate` method.
         */
        snapshot: Measurements | undefined;
        /**
         * A box defining the element's layout relative to the page. This will have been
         * captured with all parent scrolls and projection transforms unset.
         */
        layout: Measurements | undefined;
        /**
         * The layout used to calculate the previous layout animation. We use this to compare
         * layouts between renders and decide whether we need to trigger a new layout animation
         * or just let the current one play out.
         */
        targetLayout?: Box;
        /**
         * A mutable data structure we use to apply all parent transforms currently
         * acting on the element's layout. It's from here we can calculate the projectionDelta
         * required to get the element from its layout into its calculated target box.
         */
        layoutCorrected: Box;
        /**
         * An ideal projection transform we want to apply to the element. This is calculated,
         * usually when an element's layout has changed, and we want the element to look as though
         * its in its previous layout on the next Frame. From there, we animated it down to 0
         * to animate the element to its new layout.
         */
        targetDelta?: Delta;
        /**
         * A mutable structure representing the visual bounding box on the page where we want
         * and element to appear. This can be set directly but is currently derived once a frame
         * from apply targetDelta to layout.
         */
        target?: Box;
        /**
         * A mutable structure describing a visual bounding box relative to the element's
         * projected parent. If defined, target will be derived from this rather than targetDelta.
         * If not defined, we'll attempt to calculate on the first layout animation frame
         * based on the targets calculated from targetDelta. This will transfer a layout animation
         * from viewport-relative to parent-relative.
         */
        relativeTarget?: Box;
        relativeTargetOrigin?: Box;
        relativeParent?: IProjectionNode;
        /**
         * We use this to detect when its safe to shut down part of a projection tree.
         * We have to keep projecting children for scale correction and relative projection
         * until all their parents stop performing layout animations.
         */
        isTreeAnimating: boolean;
        isAnimationBlocked: boolean;
        /**
         * If true, attempt to resolve relativeTarget.
         */
        attemptToResolveRelativeTarget?: boolean;
        /**
         * A mutable structure that represents the target as transformed by the element's
         * latest user-set transforms (ie scale, x)
         */
        targetWithTransforms?: Box;
        /**
         * The previous projection delta, which we can compare with the newly calculated
         * projection delta to see if we need to render.
         */
        prevProjectionDelta?: Delta;
        /**
         * A calculated transform that will project an element from its layoutCorrected
         * into the target. This will be used by children to calculate their own layoutCorrect boxes.
         */
        projectionDelta?: Delta;
        /**
         * A calculated transform that will project an element from its layoutCorrected
         * into the targetWithTransforms.
         */
        projectionDeltaWithTransform?: Delta;
        /**
         * If we're tracking the scroll of this element, we store it here.
         */
        scroll?: ScrollMeasurements;
        /**
         * Flag to true if we think this layout has been changed. We can't always know this,
         * currently we set it to true every time a component renders, or if it has a layoutDependency
         * if that has changed between renders. Additionally, components can be grouped by LayoutGroup
         * and if one node is dirtied, they all are.
         */
        isLayoutDirty: boolean;
        /**
         * Flag to true if we think the projection calculations for this node needs
         * recalculating as a result of an updated transform or layout animation.
         */
        isProjectionDirty: boolean;
        /**
         * Flag to true if the layout *or* transform has changed. This then gets propagated
         * throughout the projection tree, forcing any element below to recalculate on the next Frame.
         */
        isSharedProjectionDirty: boolean;
        /**
         * Flag transform dirty. This gets propagated throughout the whole tree but is only
         * respected by shared nodes.
         */
        isTransformDirty: boolean;
        /**
         * Block layout updates for instant layout transitions throughout the tree.
         */
        updateManuallyBlocked: boolean;
        updateBlockedByResize: boolean;
        /**
         * Set to true between the start of the first `willUpdate` call and the end of the `didUpdate`
         * call.
         */
        isUpdating: boolean;
        /**
         * If this is an SVG element we currently disable projection transforms
         */
        isSVG: boolean;
        /**
         * Flag to true (during prosognaflow) if a node doing an instant layout transition needs to reset
         * its projection styles.
         */
        needsReset: boolean;
        /**
         * Flags whether this node should have its transform reset prior to measuring.
         */
        shouldResetTransform: boolean;
        /**
         * Store whether this node has been checked for optimised appear animations. As
         * effects fire bottom-up, and we want to look up the tree for appear animations,
         * this makes sure we only check each path once, stopping at nodes that
         * have already been checked.
         */
        hasCheckedOptimisedAppear: boolean;
        /**
         * An object representing the calculated contextual/accumulated/tree scale.
         * This will be used to scale calculcated projection transforms, as these are
         * calculated in screen-space but need to be scaled for elements to layoutly
         * make it to their calculated destinations.
         *
         * TODO: Lazy-init
         */
        treeScale: Point;
        /**
         * Is hydrated with a projection node if an element is animating from another.
         */
        resumeFrom?: IProjectionNode;
        /**
         * Is hydrated with a projection node if an element is animating from another.
         */
        resumingFrom?: IProjectionNode;
        /**
         * A reference to the element's latest animated values. This is a reference shared
         * between the element's VisualElement and the ProjectionNode.
         */
        latestValues: ResolvedValues;
        /**
         *
         */
        eventHandlers: Map<LayoutEvents, SubscriptionManager<any>>;
        nodes?: FlatTree;
        depth: number;
        /**
         * If transformTemplate generates a different value before/after the
         * update, we need to reset the transform.
         */
        prevTransformTemplateValue: string | undefined;
        preserveOpacity?: boolean;
        hasTreeAnimated: boolean;
        layoutVersion: number;
        addEventListener(name: LayoutEvents, handler: any): VoidFunction;
        notifyListeners(name: LayoutEvents, ...args: any): void;
        hasListeners(name: LayoutEvents): boolean;
        /**
         * Lifecycles
         */
        mount(instance: I): void;
        unmount(): void;
        blockUpdate(): void;
        unblockUpdate(): void;
        isUpdateBlocked(): boolean;
        isTreeAnimationBlocked(): boolean;
        startUpdate(): void;
        getTransformTemplate(): import("../..").TransformTemplate | undefined;
        willUpdate(shouldNotifyListeners?: boolean): void;
        updateScheduled: boolean;
        update(): void;
        scheduleUpdate: () => void;
        didUpdate(): void;
        clearAllSnapshots(): void;
        projectionUpdateScheduled: boolean;
        scheduleUpdateProjection(): void;
        scheduleCheckAfterUnmount(): void;
        checkUpdateFailed: () => void;
        /**
         * This is a multi-step process as shared nodes might be of different depths. Nodes
         * are sorted by depth order, so we need to resolve the entire tree before moving to
         * the next step.
         */
        updateProjection: () => void;
        /**
         * Update measurements
         */
        updateSnapshot(): void;
        updateLayout(): void;
        updateScroll(phase?: Phase): void;
        resetTransform(): void;
        measure(removeTransform?: boolean): {
            animationId: number;
            measuredBox: Box;
            layoutBox: Box;
            latestValues: {};
            source: number;
        };
        measurePageBox(): Box;
        removeElementScroll(box: Box): Box;
        applyTransform(box: Box, transformOnly?: boolean, output?: Box): Box;
        removeTransform(box: Box): Box;
        setTargetDelta(delta: Delta): void;
        setOptions(options: ProjectionNodeOptions): void;
        clearMeasurements(): void;
        forceRelativeParentToResolveTarget(): void;
        /**
         * Frame calculations
         */
        resolvedRelativeTargetAt: number;
        resolveTargetDelta(forceRecalculation?: boolean): void;
        getClosestProjectingParent(): IProjectionNode<unknown> | undefined;
        isProjecting(): boolean;
        linkedParentVersion: number;
        createRelativeTarget(relativeParent: IProjectionNode, layout: Box, parentLayout: Box): void;
        removeRelativeTarget(): void;
        hasProjected: boolean;
        calcProjection(): void;
        isVisible: boolean;
        hide(): void;
        show(): void;
        scheduleRender(notifyAll?: boolean): void;
        createProjectionDeltas(): void;
        /**
         * Animation
         */
        animationValues?: ResolvedValues;
        pendingAnimation?: Process;
        currentAnimation?: JSAnimation<number>;
        mixTargetDelta: (progress: number) => void;
        animationProgress: number;
        setAnimationOrigin(delta: Delta, hasOnlyRelativeTargetChanged?: boolean): void;
        sognaflowValue?: SognaflowValue<number>;
        startAnimation(options: ValueAnimationOptions<number>): void;
        completeAnimation(): void;
        finishAnimation(): void;
        applyTransformsToTarget(): void;
        /**
         * Shared layout
         */
        sharedNodes: Map<string, NodeStack>;
        registerSharedNode(layoutId: string, node: IProjectionNode): void;
        isLead(): boolean;
        getLead(): IProjectionNode<unknown> | /*elided*/ any;
        getPrevLead(): IProjectionNode<unknown> | undefined;
        getStack(): NodeStack | undefined;
        promote({ needsReset, transition, preserveFollowOpacity, }?: {
            needsReset?: boolean;
            transition?: Transition;
            preserveFollowOpacity?: boolean;
        }): void;
        relegate(): boolean;
        resetSkewAndRotation(): void;
        applyProjectionStyles(targetStyle: any, styleProp?: SognaflowStyle): void;
        clearSnapshot(): void;
        resetTree(): void;
    };
};
export declare function PropagateDirtyNodes(node: IProjectionNode): void;
export declare function CleanDirtyNodes(node: IProjectionNode): void;
export declare function MixAxisDelta(output: AxisDelta, delta: AxisDelta, p: number): void;
export declare function MixAxis(output: Axis, from: Axis, to: Axis, p: number): void;
export declare function MixBox(output: Box, from: Box, to: Box, p: number): void;
