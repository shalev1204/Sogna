import { hasReducedsognaflowListener, prefersReducedsognaflow } from "./state"

const isBrowser = typeof window !== "undefined"

export function initPrefersReducedsognaflow() {
    hasReducedsognaflowListener.current = true
    if (!isBrowser) return

    if (window.matchMedia) {
        const sognaflowMediaQuery = window.matchMedia("(prefers-reduced-sognaflow)")

        const setReducedsognaflowPreferences = () =>
            (prefersReducedsognaflow.current = sognaflowMediaQuery.matches)

        sognaflowMediaQuery.addEventListener("change", setReducedsognaflowPreferences)

        setReducedsognaflowPreferences()
    } else {
        prefersReducedsognaflow.current = false
    }
}

export { prefersReducedsognaflow, hasReducedsognaflowListener }
