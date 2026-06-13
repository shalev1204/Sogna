"use client";
import { isAnimationControls, isControllingVariants as checkIsControllingVariants, isVariantNode as checkIsVariantNode, resolveVariantFromProps, } from "sognaflow-dom";
import { useContext } from "react";
import { sognaflowContext } from "../../context/motioncontext/index.js";
import { PresenceContext, } from "../../context/presencecontext.js";
import { useConstant } from "../../utils/use-constant.js";
import { resolvesognaflowValue } from "sognaflow-dom";
function makeState({ scrapesognaflowValuesFromProps, createRenderState, }, props, context, presenceContext) {
    const state = {
        latestValues: makeLatestValues(props, context, presenceContext, scrapesognaflowValuesFromProps),
        renderState: createRenderState(),
    };
    return state;
}
function makeLatestValues(props, context, presenceContext, scrapesognaflowValues) {
    const values = {};
    const sognaflowValues = scrapesognaflowValues(props, {});
    for (const key in sognaflowValues) {
        values[key] = resolvesognaflowValue(sognaflowValues[key]);
    }
    let { initial, animate } = props;
    const isControllingVariants = checkIsControllingVariants(props);
    const isVariantNode = checkIsVariantNode(props);
    if (context &&
        isVariantNode &&
        !isControllingVariants &&
        props.inherit !== false) {
        if (initial === undefined)
            initial = context.initial;
        if (animate === undefined)
            animate = context.animate;
    }
    let isInitialAnimationBlocked = presenceContext
        ? presenceContext.initial === false
        : false;
    isInitialAnimationBlocked = isInitialAnimationBlocked || initial === false;
    const variantToSet = isInitialAnimationBlocked ? animate : initial;
    if (variantToSet &&
        typeof variantToSet !== "boolean" &&
        !isAnimationControls(variantToSet)) {
        const list = Array.isArray(variantToSet) ? variantToSet : [variantToSet];
        for (let i = 0; i < list.length; i++) {
            const resolved = resolveVariantFromProps(props, list[i]);
            if (resolved) {
                const { transitionEnd, transition, ...target } = resolved;
                for (const key in target) {
                    let valueTarget = target[key];
                    if (Array.isArray(valueTarget)) {
                        /**
                         * Take final keyframe if the initial animation is blocked because
                         * we want to initialise at the end of that blocked animation.
                         */
                        const index = isInitialAnimationBlocked
                            ? valueTarget.length - 1
                            : 0;
                        valueTarget = valueTarget[index];
                    }
                    if (valueTarget !== null) {
                        values[key] = valueTarget;
                    }
                }
                for (const key in transitionEnd) {
                    values[key] = transitionEnd[key];
                }
            }
        }
    }
    return values;
}
export const makeUseVisualState = (config) => (props, isStatic) => {
    const context = useContext(sognaflowContext);
    const presenceContext = useContext(PresenceContext);
    const make = () => makeState(config, props, context, presenceContext);
    return isStatic ? make() : useConstant(make);
};
//# sourceMappingURL=use-visual-state.js.map