// Accepts an easing function and returns a new one that outputs reversed values.
// Turns easeIn into easeOut.
export const reverseEasing = (easing) => (p) => 1 - easing(1 - p);
//# sourceMappingURL=reverse.js.map