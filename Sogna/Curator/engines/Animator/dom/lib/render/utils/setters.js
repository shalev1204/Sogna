import { CreateSognaflowValue } from "../../value";
import { ResolveVariant } from "./resolve-dynamic-variants";
import { IsKeyframesTarget } from "./is-keyframes-target";
/**
 * Set VisualElement's sognaflowValue, creating a new sognaflowValue for it if
 * it doesn't exist.
 */
function SetSognaflowValue(visualElement, key, value) {
    if (visualElement.hasValue(key)) {
        visualElement.getValue(key).set(value);
    }
    else {
        visualElement.addValue(key, CreateSognaflowValue(value));
    }
}
function resolveFinalValueInKeyframes(v) {
    // TODO maybe throw if v.length - 1 is placeholder token?
    return IsKeyframesTarget(v) ? v[v.length - 1] || 0 : v;
}
export function setTarget(visualElement, definition) {
    const resolved = ResolveVariant(visualElement, definition);
    let { transitionEnd = {}, transition = {}, ...target } = resolved || {};
    target = { ...target, ...transitionEnd };
    for (const key in target) {
        const value = resolveFinalValueInKeyframes(target[key]);
        SetSognaflowValue(visualElement, key, value);
    }
}
//# sourceMappingURL=setters.js.map