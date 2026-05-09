"use client";
import { cancelFrame, frame } from "sognaflow-dom";
import { useContext, useEffect, useRef } from "react";
import { sognaflowConfigContext } from "../context/motionconfigcontext.js";
export function useAnimationFrame(callback) {
    const initialTimestamp = useRef(0);
    const { isStatic } = useContext(sognaflowConfigContext);
    useEffect(() => {
        if (isStatic)
            return;
        const provideTimeSinceStart = ({ timestamp, delta }) => {
            if (!initialTimestamp.current)
                initialTimestamp.current = timestamp;
            callback(timestamp - initialTimestamp.current, delta);
        };
        frame.update(provideTimeSinceStart, true);
        return () => cancelFrame(provideTimeSinceStart);
    }, [callback]);
}
//# sourceMappingURL=use-animation-frame.js.map
