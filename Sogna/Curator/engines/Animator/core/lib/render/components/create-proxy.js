import { warnOnce } from "sognaflow-utils";
import { createsognaflowComponent } from "../../motion";
export function createsognaflowProxy(preloadedFeatures, createVisualElement) {
    if (typeof Proxy === "undefined") {
        return createsognaflowComponent;
    }
    /**
     * A cache of generated `sognaflow` components, e.g `sognaflow.div`, `sognaflow.input` etc.
     * Rather than generating them anew every render.
     */
    const componentCache = new Map();
    const factory = (Component, options) => {
        return createsognaflowComponent(Component, options, preloadedFeatures, createVisualElement);
    };
    /**
     * Support for deprecated`sognaflow(Component)` pattern
     */
    const deprecatedFactoryFunction = (Component, options) => {
        if (process.env.NODE_ENV !== "production") {
            warnOnce(false, "sognaflow() is deprecated. Use sognaflow.create() instead.");
        }
        return factory(Component, options);
    };
    return new Proxy(deprecatedFactoryFunction, {
        /**
         * Called when `sognaflow` is referenced with a prop: `sognaflow.div`, `sognaflow.input` etc.
         * The prop name is passed through as `key` and we can use that to generate a `sognaflow`
         * DOM component with that name.
         */
        get: (_target, key) => {
            if (key === "create")
                return factory;
            /**
             * If this element doesn't exist in the component cache, create it and cache.
             */
            if (!componentCache.has(key)) {
                componentCache.set(key, createsognaflowComponent(key, undefined, preloadedFeatures, createVisualElement));
            }
            return componentCache.get(key);
        },
    });
}
//# sourceMappingURL=create-proxy.js.map