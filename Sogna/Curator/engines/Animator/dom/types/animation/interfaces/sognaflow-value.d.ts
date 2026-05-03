import type { AnyResolvedKeyframe, ValueTransition } from "../types";
import type { UnresolvedKeyframes } from "../keyframes/keyframesresolver";
import type { SognaflowValue, StartAnimation } from "../../value";
import type { VisualElement } from "../../render/visualelement";
export declare const AnimateSognaflowValue: <V extends AnyResolvedKeyframe>(name: string, value: SognaflowValue<V>, target: V | UnresolvedKeyframes<V>, transition?: ValueTransition & {
    elapsed?: number;
}, element?: VisualElement<any>, isHandoff?: boolean) => StartAnimation;
