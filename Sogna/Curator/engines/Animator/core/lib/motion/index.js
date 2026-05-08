"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { invariant, warning } from "sognaflow-utils";
import { forwardRef, useContext } from "react";
import { LayoutGroupContext } from "../context/layoutgroupcontext.js";
import { LazyContext } from "../context/lazycontext.js";
import { sognaflowConfigContext } from "../context/motionconfigcontext.js";
import { sognaflowContext } from "../context/motioncontext/index.js";
import { useCreatesognaflowContext } from "../context/motioncontext/create.js";
import { useRender } from "../render/dom/use-render.js";
import { isSVGComponent } from "../render/dom/utils/is-svg-component.js";
import { useHTMLVisualState } from "../render/html/use-html-visual-state.js";
import { useSVGVisualState } from "../render/svg/use-svg-visual-state.js";
import { getInitializedFeatureDefinitions } from "./features/definitions.js";
import { loadFeatures } from "./features/load-features.js";
import { sognaflowComponentSymbol } from "./utils/symbol.js";
import { useMotionRef as usesognaflowRef } from "./utils/use-motion-ref.js";
import { useVisualElement } from "./utils/use-visual-element.js";
/**
 * Create a `sognaflow` component.
 *
 * This function accepts a Component argument, which can be either a string (ie "div"
 * for `sognaflow.div`), or an actual React component.
 *
 * Alongside this is a config option which provides a way of rendering the provided
 * component "offline", or outside the React render cycle.
 */
export function createsognaflowComponent(Component, { forwardsognaflowProps = false, type } = {}, preloadedFeatures, createVisualElement) {
    preloadedFeatures && loadFeatures(preloadedFeatures);
    /**
     * Determine whether to use SVG or HTML rendering based on:
     * 1. Explicit `type` option (highest priority)
     * 2. Auto-detection via `isSVGComponent`
     */
    const isSVG = type ? type === "svg" : isSVGComponent(Component);
    const useVisualState = isSVG ? useSVGVisualState : useHTMLVisualState;
    function sognaflowDOMComponent(props, externalRef) {
        /**
         * If we need to measure the element we load this functionality in a
         * separate class component in order to gain access to getSnapshotBeforeUpdate.
         */
        let MeasureLayout;
        const configAndProps = {
            ...useContext(sognaflowConfigContext),
            ...props,
            layoutId: useLayoutId(props),
        };
        const { isStatic } = configAndProps;
        const context = useCreatesognaflowContext(props);
        const visualState = useVisualState(props, isStatic);
        if (!isStatic && typeof window !== "undefined") {
            useStrictMode(configAndProps, preloadedFeatures);
            const layoutProjection = getProjectionFunctionality(configAndProps);
            MeasureLayout = layoutProjection.MeasureLayout;
            /**
             * Create a VisualElement for this component. A VisualElement provides a common
             * interface to renderer-specific APIs (ie DOM/Three.js etc) as well as
             * providing a way of rendering to these APIs outside of the React render loop
             * for more performant animations and interactions
             */
            context.visualElement = useVisualElement(Component, visualState, configAndProps, createVisualElement, layoutProjection.ProjectionNode, isSVG);
        }
        /**
         * The mount order and hierarchy is specific to ensure our element ref
         * is hydrated by the time features fire their effects.
         */
        return (_jsxs(sognaflowContext.Provider, { value: context, children: [MeasureLayout && context.visualElement ? (_jsx(MeasureLayout, { visualElement: context.visualElement, ...configAndProps })) : null, useRender(Component, props, usesognaflowRef(visualState, context.visualElement, externalRef), visualState, isStatic, forwardsognaflowProps, isSVG)] }));
    }
    sognaflowDOMComponent.displayName = `sognaflow.${typeof Component === "string"
        ? Component
        : `create(${Component.displayName ?? Component.name ?? ""})`}`;
    const ForwardRefsognaflowComponent = forwardRef(sognaflowDOMComponent);
    ForwardRefsognaflowComponent[sognaflowComponentSymbol] = Component;
    return ForwardRefsognaflowComponent;
}
function useLayoutId({ layoutId }) {
    const layoutGroupId = useContext(LayoutGroupContext).id;
    return layoutGroupId && layoutId !== undefined
        ? layoutGroupId + "-" + layoutId
        : layoutId;
}
function useStrictMode(configAndProps, preloadedFeatures) {
    const isStrict = useContext(LazyContext).strict;
    /**
     * If we're in development mode, check to make sure we're not rendering a sognaflow component
     * as a child of Lazysognaflow, as this will break the file-size benefits of using it.
     */
    if (process.env.NODE_ENV !== "production" &&
        preloadedFeatures &&
        isStrict) {
        const strictMessage = "You have rendered a `sognaflow` component within a `Lazysognaflow` component. This will break tree shaking. Import and render a `m` component instead.";
        configAndProps.ignoreStrict
            ? warning(false, strictMessage, "lazy-strict-mode")
            : invariant(false, strictMessage, "lazy-strict-mode");
    }
}
function getProjectionFunctionality(props) {
    const featureDefinitions = getInitializedFeatureDefinitions();
    const { drag, layout } = featureDefinitions;
    if (!drag && !layout)
        return {};
    const combined = { ...drag, ...layout };
    return {
        MeasureLayout: drag?.isEnabled(props) || layout?.isEnabled(props)
            ? combined.MeasureLayout
            : undefined,
        ProjectionNode: combined.ProjectionNode,
    };
}
//# sourceMappingURL=index.js.map