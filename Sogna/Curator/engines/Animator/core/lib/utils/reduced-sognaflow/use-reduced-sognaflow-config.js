"use client";
import { useContext } from "react";
import { sognaflowConfigContext } from "../../context/MotionConfigContext.js";
import { useReducedsognaflow } from "./use-reduced-sognaflow.js";
export function useReducedsognaflowConfig() {
    const reducedsognaflowPreference = useReducedsognaflow();
    const { reducedsognaflow } = useContext(sognaflowConfigContext);
    if (reducedsognaflow === "never") {
        return false;
    }
    else if (reducedsognaflow === "always") {
        return true;
    }
    else {
        return reducedsognaflowPreference;
    }
}
//# sourceMappingURL=use-reduced-sognaflow-config.js.map