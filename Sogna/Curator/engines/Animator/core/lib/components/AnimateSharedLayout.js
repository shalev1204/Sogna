"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { invariant } from "sognaflow-utils";
import * as React from "react";
import { useConstant } from "../utils/use-constant.js";
import { LayoutGroup } from "./layout-group/index.js";
let id = 0;
export const AnimateSharedLayout = ({ children }) => {
    React.useEffect(() => {
        invariant(false, "AnimateSharedLayout is deprecated: https://www.framer.com/docs/guide-upgrade/##shared-layout-animations");
    }, []);
    return (_jsx(LayoutGroup, { id: useConstant(() => `asl-${id++}`), children: children }));
};
//# sourceMappingURL=AnimateSharedLayout.js.map