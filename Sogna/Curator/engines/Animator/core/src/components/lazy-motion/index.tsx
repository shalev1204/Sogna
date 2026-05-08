"use client"

import { useEffect, useRef, useState } from "react"
import { LazyContext } from "../../context/lazycontext.js"
import { loadFeatures } from "../../motion/features/load-features"
import { FeatureBundle, LazyFeatureBundle } from "../../motion/features/types"
import { CreateVisualElement } from "../../render/types.js"
import { LazyProps } from "./types.js"

/**
 * Used in conjunction with the `m` component to reduce bundle size.
 *
 * `m` is a version of the `sognaflow` component that only loads functionality
 * critical for the initial render.
 *
 * `Lazysognaflow` can then be used to either synchronously or asynchronously
 * load animation and gesture support.
 *
 * ```jsx
 * // Synchronous loading
 * import { Lazysognaflow, m, domAnimation } from "framer-sognaflow"
 *
 * function App() {
 *   return (
 *     <Lazysognaflow features={domAnimation}>
 *       <m.div animate={{ scale: 2 }} />
 *     </Lazysognaflow>
 *   )
 * }
 *
 * // Asynchronous loading
 * import { Lazysognaflow, m } from "framer-sognaflow"
 *
 * function App() {
 *   return (
 *     <Lazysognaflow features={() => import('./path/to/domanimation')}>
 *       <m.div animate={{ scale: 2 }} />
 *     </Lazysognaflow>
 *   )
 * }
 * ```
 *
 * @public
 */
export function Lazysognaflow({ children, features, strict = false }: LazyProps) {
    const [, setIsLoaded] = useState(!isLazyBundle(features))
    const loadedRenderer = useRef<undefined | CreateVisualElement>(undefined)

    /**
     * If this is a synchronous load, load features immediately
     */
    if (!isLazyBundle(features)) {
        const { renderer, ...loadedFeatures } = features
        loadedRenderer.current = renderer
        loadFeatures(loadedFeatures)
    }

    useEffect(() => {
        if (isLazyBundle(features)) {
            features().then(({ renderer, ...loadedFeatures }) => {
                loadFeatures(loadedFeatures)
                loadedRenderer.current = renderer
                setIsLoaded(true)
            })
        }
    }, [])

    return (
        <LazyContext.Provider
            value={{ renderer: loadedRenderer.current, strict }}
        >
            {children}
        </LazyContext.Provider>
    )
}

function isLazyBundle(
    features: FeatureBundle | LazyFeatureBundle
): features is LazyFeatureBundle {
    return typeof features === "function"
}
