import type { VisualElement } from "sognaflow-dom";
import * as React from "react";
import { VisualState } from "./use-visual-state.js";
/**
 * Creates a ref function that, when called, hydrates the provided
 * external ref and VisualElement.
 */
export declare function usesognaflowRef<Instance, RenderState>(visualState: VisualState<Instance, RenderState>, visualElement?: VisualElement<Instance> | null, externalRef?: React.Ref<Instance>): React.Ref<Instance>;
export declare const useMotionRef: typeof usesognaflowRef;
