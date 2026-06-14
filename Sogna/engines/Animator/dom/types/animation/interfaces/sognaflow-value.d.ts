import type { AnyResolvedKeyframe, ValueTransition } from "../types.js";
import type { UnresolvedKeyframes } from "../keyframes/keyframesresolver.js";
import type { SognaflowValue, StartAnimation } from "../../value";
import type { VisualElement } from "../../render/visualelement.js";
export declare const AnimateSognaflowValue: <V extends AnyResolvedKeyframe>(name: string, value: SognaflowValue<V>, target: V | UnresolvedKeyframes<V>, transition?: ValueTransition & {
    elapsed?: number;
}, element?: VisualElement<any>, isHandoff?: boolean) => StartAnimation;
