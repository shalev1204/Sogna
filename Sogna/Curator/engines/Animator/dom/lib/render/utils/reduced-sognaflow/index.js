import { HasReducedSognaflowListener, PrefersReducedSognaflow } from "./state.js";
const isBrowser = typeof window !== "undefined";
export function InitPrefersReducedSognaflow() {
    HasReducedSognaflowListener.current = true;
    if (!isBrowser)
        return;
    if (window.matchMedia) {
        const sognaflowMediaQuery = window.matchMedia("(prefers-reduced-motion)");
        const setReducedSognaflowPreferences = () => (PrefersReducedSognaflow.current = sognaflowMediaQuery.matches);
        sognaflowMediaQuery.addEventListener("change", setReducedSognaflowPreferences);
        setReducedSognaflowPreferences();
    }
    else {
        PrefersReducedSognaflow.current = false;
    }
}
export { PrefersReducedSognaflow, HasReducedSognaflowListener, InitPrefersReducedSognaflow as initPrefersReducedsognaflow, PrefersReducedSognaflow as prefersReducedsognaflow, };
//# sourceMappingURL=index.js.map
