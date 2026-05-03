import { progress } from "sognaflow-utils";
import { MixNumber as mixNumber } from "../../../utils/mix/number";
export function fillOffset(offset, remaining) {
    const min = offset[offset.length - 1];
    for (let i = 1; i <= remaining; i++) {
        const offsetProgress = progress(0, remaining, i);
        offset.push(mixNumber(min, 1, offsetProgress));
    }
}
//# sourceMappingURL=fill.js.map