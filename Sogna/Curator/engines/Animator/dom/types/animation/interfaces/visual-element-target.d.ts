import type { VisualElementAnimationOptions } from "./types";
import type { AnimationPlaybackControlsWithThen } from "../types";
import type { TargetAndTransition } from "../../node/types";
import type { VisualElement } from "../../render/visualelement";
export declare function AnimateTarget(visualElement: VisualElement, targetAndTransition: TargetAndTransition, { delay, transitionOverride, type }?: VisualElementAnimationOptions): AnimationPlaybackControlsWithThen[];
