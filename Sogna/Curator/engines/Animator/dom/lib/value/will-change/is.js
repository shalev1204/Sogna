import { IsSognaflowValue } from "../utils/is-sognaflow-value.js";
export function IsWillChangeSognaflowValue(value) {
    return Boolean(IsSognaflowValue(value) && value.add);
}
//# sourceMappingURL=is.js.map