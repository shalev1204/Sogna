import { IsCSSVariableName as isCSSVariableName } from "../../animation/utils/is-css-variable.js";
import { CorrectBorderRadius as correctBorderRadius } from "./scale-border-radius.js";
import { CorrectBoxShadow as correctBoxShadow } from "./scale-box-shadow.js";
export const ScaleCorrectors = {
    borderRadius: {
        ...correctBorderRadius,
        applyTo: [
            "borderTopLeftRadius",
            "borderTopRightRadius",
            "borderBottomLeftRadius",
            "borderBottomRightRadius",
        ],
    },
    borderTopLeftRadius: correctBorderRadius,
    borderTopRightRadius: correctBorderRadius,
    borderBottomLeftRadius: correctBorderRadius,
    borderBottomRightRadius: correctBorderRadius,
    boxShadow: correctBoxShadow,
};
export function AddScaleCorrector(correctors) {
    for (const key in correctors) {
        ScaleCorrectors[key] = correctors[key];
        if (isCSSVariableName(key)) {
            ScaleCorrectors[key].isCSSVariable = true;
        }
    }
}
//# sourceMappingURL=scale-correction.js.map