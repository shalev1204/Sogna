import { Feature, type VisualElement } from "sognaflow-dom";
export declare class AnimationFeature extends Feature<unknown> {
    unmountControls?: () => void;
    /**
     * We dynamically generate the AnimationState manager as it contains a reference
     * to the underlying animation library. We only want to load that if we load this,
     * so people can optionally code split it out using the `m` component.
     */
    constructor(node: VisualElement);
    updateAnimationControlsSubscription(): void;
    /**
     * Subscribe any provided AnimationControls to the component's VisualElement
     */
    mount(): void;
    update(): void;
    unmount(): void;
}
