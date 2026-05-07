"use client";
import { useContext } from "react";
import { PresenceContext } from "../../context/PresenceContext.js";
export function usePresenceData() {
    const context = useContext(PresenceContext);
    return context ? context.custom : undefined;
}
//# sourceMappingURL=use-presence-data.js.map