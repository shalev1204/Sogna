"use client";
import { sognaflowValue, supportsScrollTimeline, supportsViewTimeline, } from "sognaflow-dom";
import { invariant } from "sognaflow-utils";
import { useCallback, useEffect, useRef } from "react";
import { scroll } from "../render/dom/scroll";
import { offsetToViewTimelineRange } from "../render/dom/scroll/utils/offset-to-range.js";
import { useConstant } from "../utils/use-constant.js";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-effect.js";
const createScrollsognaflowValues = () => ({
    scrollX: sognaflowValue(0),
    scrollY: sognaflowValue(0),
    scrollXProgress: sognaflowValue(0),
    scrollYProgress: sognaflowValue(0),
});
const isRefPending = (ref) => {
    if (!ref)
        return false;
    return !ref.current;
};
function makeAccelerateConfig(axis, options, container, target) {
    return {
        factory: (animation) => scroll(animation, {
            ...options,
            axis,
            container: container?.current || undefined,
            target: target?.current || undefined,
        }),
        times: [0, 1],
        keyframes: [0, 1],
        ease: (v) => v,
        duration: 1,
    };
}
function canAccelerateScroll(target, offset) {
    if (typeof window === "undefined")
        return false;
    return target
        ? supportsViewTimeline() && !!offsetToViewTimelineRange(offset)
        : supportsScrollTimeline();
}
export function useScroll({ container, target, ...options } = {}) {
    const values = useConstant(createScrollsognaflowValues);
    if (canAccelerateScroll(target, options.offset)) {
        values.scrollXProgress.accelerate = makeAccelerateConfig("x", options, container, target);
        values.scrollYProgress.accelerate = makeAccelerateConfig("y", options, container, target);
    }
    const scrollAnimation = useRef(null);
    const needsStart = useRef(false);
    const start = useCallback(() => {
        scrollAnimation.current = scroll((_progress, { x, y, }) => {
            values.scrollX.set(x.current);
            values.scrollXProgress.set(x.progress);
            values.scrollY.set(y.current);
            values.scrollYProgress.set(y.progress);
        }, {
            ...options,
            container: container?.current || undefined,
            target: target?.current || undefined,
        });
        return () => {
            scrollAnimation.current?.();
        };
    }, [container, target, JSON.stringify(options.offset)]);
    useIsomorphicLayoutEffect(() => {
        needsStart.current = false;
        if (isRefPending(container) || isRefPending(target)) {
            needsStart.current = true;
            return;
        }
        else {
            return start();
        }
    }, [start]);
    useEffect(() => {
        if (needsStart.current) {
            invariant(!isRefPending(container), "Container ref is defined but not hydrated", "use-scroll-ref");
            invariant(!isRefPending(target), "Target ref is defined but not hydrated", "use-scroll-ref");
            return start();
        }
        else {
            return;
        }
    }, [start]);
    return values;
}
//# sourceMappingURL=use-scroll.js.map
