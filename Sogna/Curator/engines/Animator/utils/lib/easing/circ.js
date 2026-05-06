import { mirrorEasing } from "./modifiers/mirror.js";
import { reverseEasing } from "./modifiers/reverse.js";
export const circIn = (p) => 1 - Math.sin(Math.acos(p));
export const circOut = reverseEasing(circIn);
export const circInOut = mirrorEasing(circIn);
//# sourceMappingURL=circ.js.map