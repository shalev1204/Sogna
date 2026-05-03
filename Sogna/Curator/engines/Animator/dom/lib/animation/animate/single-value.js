import { AnimateSognaflowValue } from "../interfaces/sognaflow-value";
import { CreateSognaflowValue, } from "../../value";
import { IsSognaflowValue } from "../../value/utils/is-sognaflow-value";
export function AnimateSingleValue(value, keyframes, options) {
    const sognaflowValue = IsSognaflowValue(value) ? value : CreateSognaflowValue(value);
    sognaflowValue.start(AnimateSognaflowValue("", sognaflowValue, keyframes, options));
    return sognaflowValue.animation;
}
//# sourceMappingURL=single-value.js.map