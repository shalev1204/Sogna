import type { AnimationDefinition, TargetAndTransition, TargetResolver } from "../../node/types.js";
/**
 * Resolves a variant if it's a variant resolver.
 * Uses `any` type for visualElement to avoid circular dependencies.
 */
export declare function ResolveVariant(visualElement: any, definition?: TargetAndTransition | TargetResolver, custom?: any): TargetAndTransition;
export declare function ResolveVariant(visualElement: any, definition?: AnimationDefinition, custom?: any): TargetAndTransition | undefined;
