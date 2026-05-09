"use client";
import { animations } from "../../motion/features/animations";
import { gestureAnimations } from "../../motion/features/gestures";
import { createDomVisualElement } from "./create-visual-element.js";
/**
 * @public
 */
export const domAnimation = {
    renderer: createDomVisualElement,
    ...animations,
    ...gestureAnimations,
};
//# sourceMappingURL=features-animation.js.map
