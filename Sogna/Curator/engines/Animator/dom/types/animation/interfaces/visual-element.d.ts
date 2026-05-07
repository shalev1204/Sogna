import type { AnimationDefinition } from "../../node/types.js";
import type { VisualElement } from "../../render/VisualElement.js";
import type { VisualElementAnimationOptions } from "./types.js";
export declare function AnimateVisualElement(visualElement: VisualElement, definition: AnimationDefinition, options?: VisualElementAnimationOptions): Promise<void>;
