import { isBezierDefinition } from "sognaflow-utils";
import { supportsLinearEasing } from "../../../utils/supports/linear-easing";
import { supportedWaapiEasing } from "./supported";
export function isWaapiSupportedEasing(easing) {
    return Boolean((typeof easing === "function" && supportsLinearEasing()) ||
        !easing ||
        (typeof easing === "string" &&
            (easing in supportedWaapiEasing || supportsLinearEasing())) ||
        isBezierDefinition(easing) ||
        (Array.isArray(easing) && easing.every(isWaapiSupportedEasing)));
}
//# sourceMappingURL=is-supported.js.map