"use client";
import { buildHTMLStyles, isForcedsognaflowValue, issognaflowValue } from "sognaflow-dom";
import { useMemo } from "react";
import { createHtmlRenderState } from "./utils/create-render-state.js";
export function copyRawValuesOnly(target, source, props) {
    for (const key in source) {
        if (!issognaflowValue(source[key]) && !isForcedsognaflowValue(key, props)) {
            target[key] = source[key];
        }
    }
}
function useInitialsognaflowValues(props, visualState) {
    const { transformTemplate } = props;
    return useMemo(() => {
        const state = createHtmlRenderState();
        buildHTMLStyles(state, visualState, transformTemplate);
        return Object.assign({}, state.vars, state.style);
    }, [visualState]);
}
function useStyle(props, visualState) {
    const styleProp = props.style || {};
    const style = {};
    /**
     * Copy non-sognaflow Values straight into style
     */
    copyRawValuesOnly(style, styleProp, props);
    Object.assign(style, useInitialsognaflowValues(props, visualState));
    return style;
}
export function useHTMLProps(props, visualState) {
    // The `any` isn't ideal but it is the type of createElement props argument
    const htmlProps = {};
    const style = useStyle(props, visualState);
    if (props.drag && props.dragListener !== false) {
        // Disable the ghost element when a user drags
        htmlProps.draggable = false;
        // Disable text selection
        style.userSelect =
            style.WebkitUserSelect =
                style.WebkitTouchCallout =
                    "none";
        // Disable scrolling on the draggable direction
        style.touchAction =
            props.drag === true
                ? "none"
                : `pan-${props.drag === "x" ? "y" : "x"}`;
    }
    if (props.tabIndex === undefined &&
        (props.onTap ||
            props.onTapStart ||
            props.whileTap)) {
        htmlProps.tabIndex = 0;
    }
    htmlProps.style = style;
    return htmlProps;
}
//# sourceMappingURL=use-props.js.map