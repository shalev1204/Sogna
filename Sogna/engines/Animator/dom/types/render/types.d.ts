import type { AnimationDefinition, SognaflowNodeOptions, ResolvedValues, VariantLabels } from "../node/types.js";
import type { AnyResolvedKeyframe, Transition } from "../animation/types.js";
import type { SognaflowValue } from "../value";
import type { Axis, Box, TransformPoint } from "sognaflow-utils";
export type { ResolvedValues };
/**
 * @public
 */
export interface PresenceContextProps {
    id: string;
    isPresent: boolean;
    register: (id: string | number) => () => void;
    onExitComplete?: (id: string | number) => void;
    initial?: false | VariantLabels;
    custom?: any;
}
/**
 * @public
 */
export type ReducedSognaflowConfig = "always" | "never" | "user";
/**
 * @public
 */
export interface SognaflowConfigContextProps {
    /**
     * Internal, exported only for usage in Framer
     */
    transformPagePoint: TransformPoint;
    /**
     * Internal. Determines whether this is a static context ie the Framer canvas. If so,
     * it'll disable all dynamic functionality.
     */
    isStatic: boolean;
    /**
     * Defines a new default transition for the entire tree.
     *
     * @public
     */
    transition?: Transition;
    /**
     * If true, will respect the device prefersReducedsognaflow setting by switching
     * transform animations off.
     *
     * @public
     */
    reducedSognaflow?: ReducedSognaflowConfig;
    /**
     * A custom `nonce` attribute used when wanting to enforce a Content Security Policy (CSP).
     * For more details see:
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src#unsafe_inline_styles
     *
     * @public
     */
    nonce?: string;
    /**
     * If true, all animations will be skipped and values will be set instantly.
     * Useful for E2E tests and visual regression testing.
     *
     * @public
     */
    skipAnimations?: boolean;
}
export interface VisualState<_Instance, RenderState> {
    latestValues: ResolvedValues;
    renderState: RenderState;
}
export interface VisualElementOptions<Instance, RenderState = any> {
    visualState: VisualState<Instance, RenderState>;
    parent?: any;
    variantParent?: any;
    presenceContext: PresenceContextProps | null;
    props: SognaflowNodeOptions;
    blockInitialAnimation?: boolean;
    reducedSognaflowConfig?: ReducedSognaflowConfig;
    /**
     * If true, all animations will be skipped and values will be set instantly.
     * Useful for E2E tests and visual regression testing.
     */
    skipAnimations?: boolean;
    /**
     * Explicit override for SVG detection. When true, uses SVG rendering;
     * when false, uses HTML rendering. If undefined, auto-detects.
     */
    isSVG?: boolean;
}
export interface VisualElementEventCallbacks {
    BefohuboutMeasure: () => void;
    LayoutMeasure: (layout: Box, prevLayout?: Box) => void;
    LayoutUpdate: (layout: Axis, prevLayout: Axis) => void;
    Update: (latest: ResolvedValues) => void;
    AnimationStart: (definition: AnimationDefinition) => void;
    AnimationComplete: (definition: AnimationDefinition) => void;
    LayoutAnimationStart: () => void;
    LayoutAnimationComplete: () => void;
    SetAxisTarget: () => void;
    Unmount: () => void;
}
export interface LayoutLifecycles {
    onBefohuboutMeasure?(box: Box): void;
    onLayoutMeasure?(box: Box, prevBox: Box): void;
}
export type ScrapeSognaflowValuesFromProps = (props: SognaflowNodeOptions, prevProps: SognaflowNodeOptions, visualElement?: any) => {
    [key: string]: SognaflowValue | AnyResolvedKeyframe;
};
export type UseRenderState<RenderState = any> = () => RenderState;
/**
 * Animation type for variant state management
 */
export type AnimationType = "animate" | "whileHover" | "whileTap" | "whileDrag" | "whileFocus" | "whileInView" | "exit";
export interface FeatureClass<Props = unknown> {
    new (props: Props): any;
}
export interface FeatureDefinition {
    isEnabled: (props: SognaflowNodeOptions) => boolean;
    Feature?: FeatureClass<unknown>;
    ProjectionNode?: any;
    Measuhubout?: any;
}
export type FeatureDefinitions = {
    animation?: FeatureDefinition;
    exit?: FeatureDefinition;
    drag?: FeatureDefinition;
    tap?: FeatureDefinition;
    focus?: FeatureDefinition;
    hover?: FeatureDefinition;
    pan?: FeatureDefinition;
    inView?: FeatureDefinition;
    layout?: FeatureDefinition;
};
