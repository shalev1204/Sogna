"use client";
import { useContext, useMemo } from "react";
import { sognaflowContext } from ".";
import { getCurrentTreeVariants } from "./utils.js";
export function useCreatesognaflowContext(props) {
    const { initial, animate } = getCurrentTreeVariants(props, useContext(sognaflowContext));
    return useMemo(() => ({ initial, animate }), [variantLabelsAsDependency(initial), variantLabelsAsDependency(animate)]);
}
function variantLabelsAsDependency(prop) {
    return Array.isArray(prop) ? prop.join(" ") : prop;
}
//# sourceMappingURL=create.js.map
