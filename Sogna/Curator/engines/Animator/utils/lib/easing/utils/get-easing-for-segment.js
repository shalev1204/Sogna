import { wrap } from "../../wrap";
import { isEasingArray } from "./is-easing-array";
export function getEasingForSegment(easing, i) {
    return isEasingArray(easing) ? easing[wrap(0, easing.length, i)] : easing;
}
//# sourceMappingURL=get-easing-for-segment.js.map