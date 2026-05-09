"use client";
import { drag } from "../../motion/features/drag";
import { layout } from "../../motion/features/layout";
import { domAnimation } from "./features-animation.js";
/**
 * @public
 */
export const domMax = {
    ...domAnimation,
    ...drag,
    ...layout,
};
//# sourceMappingURL=features-max.js.map
