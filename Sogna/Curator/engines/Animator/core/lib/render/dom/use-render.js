"use client";
import { issognaflowValue } from "sognaflow-dom";
import { Fragment, createElement, useMemo } from "react";
import { useHTMLProps } from "../html/use-props.js";
import { useSVGProps } from "../svg/use-props.js";
import { filterProps } from "./utils/filter-props.js";
import { isSVGComponent } from "./utils/is-svg-component.js";
export function useRender(Component, props, ref, { latestValues, }, isStatic, forwardsognaflowProps = false, isSVG) {
    const useVisualProps = (isSVG ?? isSVGComponent(Component)) ? useSVGProps : useHTMLProps;
    const visualProps = useVisualProps(props, latestValues, isStatic, Component);
    const filteredProps = filterProps(props, typeof Component === "string", forwardsognaflowProps);
    const elementProps = Component !== Fragment ? { ...filteredProps, ...visualProps, ref } : {};
    /**
     * If component has been handed a sognaflow value as its child,
     * memoise its initial value and render that. Subsequent updates
     * will be handled by the onChange handler
     */
    const { children } = props;
    const renderedChildren = useMemo(() => (issognaflowValue(children) ? children.get() : children), [children]);
    return createElement(Component, {
        ...elementProps,
        children: renderedChildren,
    });
}
//# sourceMappingURL=use-render.js.map
