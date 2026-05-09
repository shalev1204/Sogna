"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { useId, useMemo } from "react";
import { PresenceContext, } from "../../context/presencecontext.js";
import { useConstant } from "../../utils/use-constant.js";
import { PopChild } from "./popchild.js";
export const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode, anchorX, anchorY, root }) => {
    const presenceChildren = useConstant(newChildrenMap);
    const id = useId();
    let isReusedContext = true;
    let context = useMemo(() => {
        isReusedContext = false;
        return {
            id,
            initial,
            isPresent,
            custom,
            onExitComplete: (childId) => {
                presenceChildren.set(childId, true);
                for (const isComplete of presenceChildren.values()) {
                    if (!isComplete)
                        return; // can stop searching when any is incomplete
                }
                onExitComplete && onExitComplete();
            },
            register: (childId) => {
                presenceChildren.set(childId, false);
                return () => presenceChildren.delete(childId);
            },
        };
    }, [isPresent, presenceChildren, onExitComplete]);
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    if (presenceAffectsLayout && isReusedContext) {
        context = { ...context };
    }
    useMemo(() => {
        presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
    }, [isPresent]);
    /**
     * If there's no `sognaflow` components to fire exit animations, we want to remove this
     * component immediately.
     */
    React.useEffect(() => {
        !isPresent &&
            !presenceChildren.size &&
            onExitComplete &&
            onExitComplete();
    }, [isPresent]);
    children = (_jsx(PopChild, { pop: mode === "popLayout", isPresent: isPresent, anchorX: anchorX, anchorY: anchorY, root: root, children: children }));
    return (_jsx(PresenceContext.Provider, { value: context, children: children }));
};
function newChildrenMap() {
    return new Map();
}
//# sourceMappingURL=presencechild.js.map
