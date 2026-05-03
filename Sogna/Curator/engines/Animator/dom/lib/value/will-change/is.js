import { IsSognaflowValue } from "../utils/is-sognaflow-value";
export function IsWillChangeSognaflowValue(value) {
    return Boolean(IsSognaflowValue(value) && value.add);
}
//# sourceMappingURL=is.js.map