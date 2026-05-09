import { isZeroValueString } from "sognaflow-utils";
export function IsNone(value) {
    if (typeof value === "number") {
        return value === 0;
    }
    else if (value !== null) {
        return value === "none" || value === "0" || isZeroValueString(value);
    }
    else {
        return true;
    }
}
//# sourceMappingURL=is-none.js.map
