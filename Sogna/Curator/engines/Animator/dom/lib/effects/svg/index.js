import { Frame as frame } from "../../frameloop";
import { SognaflowValue } from "../../value";
import { AddAttrValue as addAttrValue } from "../attr";
import { AddStyleValue as addStyleValue } from "../style";
import { CreateSelectorEffect as createSelectorEffect } from "../utils/create-dom-effect.js";
import { CreateEffect as createEffect } from "../utils/create-effect.js";
function AddSVGPathValue(element, state, key, value) {
    frame.render(() => element.setAttribute("pathLength", "1"));
    if (key === "pathOffset") {
        return state.set(key, value, () => {
            // Use unitless value to avoid Safari zoom bug
            const offset = state.latest[key];
            element.setAttribute("stroke-dashoffset", `${-offset}`);
        });
    }
    else {
        if (!state.get("stroke-dasharray")) {
            state.set("stroke-dasharray", new SognaflowValue("1 1"), () => {
                const { pathLength = 1, pathSpacing } = state.latest;
                // Use unitless values to avoid Safari zoom bug
                element.setAttribute("stroke-dasharray", `${pathLength} ${pathSpacing ?? 1 - Number(pathLength)}`);
            });
        }
        return state.set(key, value, undefined, state.get("stroke-dasharray"));
    }
}
const AddSVGValue = (element, state, key, value) => {
    if (key.startsWith("path")) {
        return AddSVGPathValue(element, state, key, value);
    }
    else if (key.startsWith("attr")) {
        return addAttrValue(element, state, convertAttrKey(key), value);
    }
    const handler = key in element.style ? addStyleValue : addAttrValue;
    return handler(element, state, key, value);
};
export const SVGEffect = /*@__PURE__*/ createSelectorEffect(
/*@__PURE__*/ createEffect(AddSVGValue));
function convertAttrKey(key) {
    return key.replace(/^attr([A-Z])/, (_, firstChar) => firstChar.toLowerCase());
}
//# sourceMappingURL=index.js.map