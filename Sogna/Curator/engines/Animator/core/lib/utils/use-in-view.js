"use client";
import { useEffect, useState } from "react";
import { inView } from "../render/dom/viewport";
export function useInView(ref, { root, margin, amount, once = false, initial = false, } = {}) {
    const [isInView, setInView] = useState(initial);
    useEffect(() => {
        if (!ref.current || (once && isInView))
            return;
        const onEnter = () => {
            setInView(true);
            return once ? undefined : () => setInView(false);
        };
        const options = {
            root: (root && root.current) || undefined,
            margin,
            amount,
        };
        return inView(ref.current, onEnter, options);
    }, [root, ref, margin, once, amount]);
    return isInView;
}
//# sourceMappingURL=use-in-view.js.map
