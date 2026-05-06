import { GeneratorFactory, Transition } from "../../types.js";
/**
 * Create a progress => progress easing function from a generator.
 */
export declare function createGeneratorEasing(options: Transition, scale: number | undefined, createGenerator: GeneratorFactory): {
    type: string;
    ease: (progress: number) => number;
    duration: number;
};
