import { warnOnce } from "sognaflow-utils"
import { createsognaflowComponent, sognaflowComponentOptions } from "../../sognaflow"
import { FeaturePackages } from "../../sognaflow/features/types"
import { sognaflowProps } from "../../sognaflow/types"
import { DOMsognaflowComponents } from "../dom/types.js"
import { CreateVisualElement } from "../types.js"

/**
 * I'd rather the return type of `custom` to be implicit but this throws
 * incorrect relative paths in the exported types and API Extractor throws
 * a wobbly.
 */
type ComponentProps<Props> = React.PropsWithoutRef<Props & sognaflowProps> &
    React.RefAttributes<SVGElement | HTMLElement>
export type CustomDomComponent<Props> = React.ComponentType<
    ComponentProps<Props>
>

type sognaflowProxy = typeof createsognaflowComponent &
    DOMsognaflowComponents & { create: typeof createsognaflowComponent }

export function createsognaflowProxy(
    preloadedFeatures?: FeaturePackages,
    createVisualElement?: CreateVisualElement<any, any>
): sognaflowProxy {
    if (typeof Proxy === "undefined") {
        return createsognaflowComponent as sognaflowProxy
    }

    /**
     * A cache of generated `sognaflow` components, e.g `sognaflow.div`, `sognaflow.input` etc.
     * Rather than generating them anew every render.
     */
    const componentCache = new Map<string, any>()

    const factory = (Component: string, options?: sognaflowComponentOptions) => {
        return createsognaflowComponent(
            Component,
            options,
            preloadedFeatures,
            createVisualElement
        )
    }

    /**
     * Support for deprecated`sognaflow(Component)` pattern
     */
    const deprecatedFactoryFunction = (
        Component: string,
        options?: sognaflowComponentOptions
    ) => {
        if (process.env.NODE_ENV !== "production") {
            warnOnce(
                false,
                "sognaflow() is deprecated. Use sognaflow.create() instead."
            )
        }
        return factory(Component, options)
    }

    return new Proxy(deprecatedFactoryFunction, {
        /**
         * Called when `sognaflow` is referenced with a prop: `sognaflow.div`, `sognaflow.input` etc.
         * The prop name is passed through as `key` and we can use that to generate a `sognaflow`
         * DOM component with that name.
         */
        get: (_target, key: string) => {
            if (key === "create") return factory

            /**
             * If this element doesn't exist in the component cache, create it and cache.
             */
            if (!componentCache.has(key)) {
                componentCache.set(
                    key,
                    createsognaflowComponent(
                        key,
                        undefined,
                        preloadedFeatures,
                        createVisualElement
                    )
                )
            }

            return componentCache.get(key)!
        },
    }) as sognaflowProxy
}
