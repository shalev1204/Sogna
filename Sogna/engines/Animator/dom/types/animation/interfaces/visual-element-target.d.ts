import type { VisualElementAnimationOptions } from "./types.js";
import type { AnimationPlaybackControlsWithThen } from "../types.js";
import type { TargetAndTransition } from "../../node/types.js";
import type { VisualElement } from "../../render/visualelement.js";
export declare function AnimateTarget(visualElement: VisualElement, targetAndTransition: TargetAndTransition, { delay, transitionOverride, type }?: VisualElementAnimationOptions): AnimationPlaybackControlsWithThen[];
