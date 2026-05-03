import type { AnimationDefinition } from "../../node/types";
import type { VisualElement } from "../../render/visualelement";
import type { VisualElementAnimationOptions } from "./types";
export declare function AnimateVisualElement(visualElement: VisualElement, definition: AnimationDefinition, options?: VisualElementAnimationOptions): Promise<void>;
