import { AnimationScope, AnimationOptions as DynamicAnimationOptions, GeneratorFactory } from "sognaflow-dom";
import { AnimationSequence, At, ResolvedAnimationDefinitions, SequenceOptions } from "./types.js";
export declare function createAnimationsFromSequence(sequence: AnimationSequence, { defaultTransition, ...sequenceTransition }?: SequenceOptions, scope?: AnimationScope, generators?: {
    [key: string]: GeneratorFactory;
}): ResolvedAnimationDefinitions;
export declare function getValueTransition(transition: DynamicAnimationOptions & At, key: string): DynamicAnimationOptions;
