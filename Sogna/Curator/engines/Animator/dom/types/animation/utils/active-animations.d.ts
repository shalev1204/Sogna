import { NativeAnimation } from "../nativeanimation.js";
import { AnyResolvedKeyframe } from "../types.js";
export declare const animationMapKey: (name: string, pseudoElement?: string) => string;
export declare function getAnimationMap(element: Element): Map<string, NativeAnimation<AnyResolvedKeyframe>>;
