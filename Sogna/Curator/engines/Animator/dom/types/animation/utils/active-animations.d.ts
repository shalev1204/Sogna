import { NativeAnimation } from "../nativeanimation";
import { AnyResolvedKeyframe } from "../types";
export declare const animationMapKey: (name: string, pseudoElement?: string) => string;
export declare function getAnimationMap(element: Element): Map<string, NativeAnimation<AnyResolvedKeyframe>>;
