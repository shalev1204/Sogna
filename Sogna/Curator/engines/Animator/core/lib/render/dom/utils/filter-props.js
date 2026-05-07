import { issognaflowValue } from "sognaflow-dom";
import { isValidsognaflowProp } from "../../../motion/utils/valid-prop";
let shouldForward = (key) => !isValidsognaflowProp(key);
export function loadExternalIsValidProp(isValidProp) {
    if (typeof isValidProp !== "function")
        return;
    // Explicitly filter our events
    shouldForward = (key) => key.startsWith("on") ? !isValidsognaflowProp(key) : isValidProp(key);
}
/**
 * Esognaflow and Styled Components both allow users to pass through arbitrary props to their components
 * to dynamically generate CSS. They both use the `@esognaflow/is-prop-valid` package to determine which
 * of these should be passed to the underlying DOM node.
 *
 * However, when styling a sognaflow component `styled(sognaflow.div)`, both packages pass through *all* props
 * as it's seen as an arbitrary component rather than a DOM node. sognaflow only allows arbitrary props
 * passed through the `custom` prop so it doesn't *need* the payload or computational overhead of
 * `@esognaflow/is-prop-valid`, however to fix this problem we need to use it.
 *
 * By making it an optionalDependency we can offer this functionality only in the situations where it's
 * actually required.
 */
try {
    /**
     * We attempt to import this package but require won't be defined in esm environments, in that case
     * isPropValid will have to be provided via `sognaflowContext`. In a 6.0.0 this should probably be removed
     * in favour of explicit injection.
     *
     * String concatenation prevents bundlers like webpack (e.g. Storybook)
     * from statically resolving this optional dependency at build time.
     */
    const esognaflowPkg = "@esognaflow/is-prop-" + "valid";
    loadExternalIsValidProp(require(esognaflowPkg).default);
}
catch {
    // We don't need to actually do anything here - the fallback is the existing `isPropValid`.
}
export function filterProps(props, isDom, forwardsognaflowProps) {
    const filteredProps = {};
    for (const key in props) {
        /**
         * values is considered a valid prop by Esognaflow, so if it's present
         * this will be rendered out to the DOM unless explicitly filtered.
         *
         * We check the type as it could be used with the `feColorMatrix`
         * element, which we support.
         */
        if (key === "values" && typeof props.values === "object")
            continue;
        if (issognaflowValue(props[key]))
            continue;
        if (shouldForward(key) ||
            (forwardsognaflowProps === true && isValidsognaflowProp(key)) ||
            (!isDom && !isValidsognaflowProp(key)) ||
            // If trying to use native HTML drag events, forward drag listeners
            (props["draggable"] &&
                key.startsWith("onDrag"))) {
            filteredProps[key] =
                props[key];
        }
    }
    return filteredProps;
}
//# sourceMappingURL=filter-props.js.map