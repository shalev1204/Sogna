"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useContext, useMemo, useRef } from "react";
import { LayoutGroupContext, } from "../../context/layoutgroupcontext.js";
import { DeprecatedLayoutGroupContext } from "../../context/deprecatedlayoutgroupcontext.js";
import { nodeGroup } from "../../projection.js";
import { useForceUpdate } from "../../utils/use-force-update.js";
const shouldInheritGroup = (inherit) => inherit === true;
const shouldInheritId = (inherit) => shouldInheritGroup(inherit === true) || inherit === "id";
export const LayoutGroup = ({ children, id, inherit = true }) => {
    const layoutGroupContext = useContext(LayoutGroupContext);
    const deprecatedLayoutGroupContext = useContext(DeprecatedLayoutGroupContext);
    const [forceRender, key] = useForceUpdate();
    const context = useRef(null);
    const upstreamId = layoutGroupContext.id || deprecatedLayoutGroupContext;
    if (context.current === null) {
        if (shouldInheritId(inherit) && upstreamId) {
            id = id ? upstreamId + "-" + id : upstreamId;
        }
        context.current = {
            id,
            group: shouldInheritGroup(inherit)
                ? layoutGroupContext.group || nodeGroup()
                : nodeGroup(),
        };
    }
    const memoizedContext = useMemo(() => ({ ...context.current, forceRender }), [key]);
    return (_jsx(LayoutGroupContext.Provider, { value: memoizedContext, children: children }));
};
//# sourceMappingURL=index.js.map
