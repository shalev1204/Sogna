"use client";
import { attachFollow, issognaflowValue, } from "sognaflow-dom";
import { useContext, useInsertionEffect } from "react";
import { sognaflowConfigContext } from "../context/MotionConfigContext.js";
import { usesognaflowValue } from "./use-sognaflow-value";
import { useTransform } from "./use-transform.js";
export function useFollowValue(source, options = {}) {
    const { isStatic } = useContext(sognaflowConfigContext);
    const getFromSource = () => (issognaflowValue(source) ? source.get() : source);
    // isStatic will never change, allowing early hooks return
    if (isStatic) {
        return useTransform(getFromSource);
    }
    const value = usesognaflowValue(getFromSource());
    useInsertionEffect(() => {
        return attachFollow(value, source, options);
    }, [value, JSON.stringify(options)]);
    return value;
}
//# sourceMappingURL=use-follow-value.js.map