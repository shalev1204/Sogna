import type { AnimationDefinition, TargetAndTransition, VariantLabels } from "../../node/types.js";
import type { AnimationType } from "../types.js";
import type { VisualElementAnimationOptions } from "../../animation/interfaces/types.js";
export type { VisualElementAnimationOptions };
export interface AnimationState {
    animateChanges: (type?: AnimationType) => Promise<any>;
    setActive: (type: AnimationType, isActive: boolean, options?: VisualElementAnimationOptions) => Promise<any>;
    setAnimateFunction: (fn: any) => void;
    getState: () => {
        [key: string]: AnimationTypeState;
    };
    reset: () => void;
}
interface DefinitionAndOptions {
    animation: AnimationDefinition;
    options?: VisualElementAnimationOptions;
}
export type AnimationList = string[] | TargetAndTransition[];
/**
 * Type for the animate function that can be injected.
 * This allows the animation implementation to be provided by the framework layer.
 */
export type AnimateFunction = (animations: DefinitionAndOptions[]) => Promise<any>;
export declare function createAnimationState(visualElement: any): AnimationState;
export declare function checkVariantsDidChange(prev: any, next: any): boolean;
export interface AnimationTypeState {
    isActive: boolean;
    protectedKeys: {
        [key: string]: true;
    };
    needsAnimating: {
        [key: string]: boolean;
    };
    prevResolvedValues: {
        [key: string]: any;
    };
    prevProp?: VariantLabels | TargetAndTransition;
}
