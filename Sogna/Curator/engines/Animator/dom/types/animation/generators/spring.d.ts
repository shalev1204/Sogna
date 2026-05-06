import { KeyframeGenerator, Transition, ValueAnimationOptions } from "../types.js";
declare function spring(optionsOrVisualDuration?: ValueAnimationOptions<number> | number, bounce?: number): KeyframeGenerator<number>;
declare namespace spring {
    var applyToOptions: (options: Transition) => Transition;
}
export { spring };
