import { appearAnimationStore } from "./store.js";
import { appearStoreId } from "./store-id.js";
export function handoffOptimizedAppearAnimation(elementId, valueName, frame) {
    const storeId = appearStoreId(elementId, valueName);
    const optimisedAnimation = appearAnimationStore.get(storeId);
    if (!optimisedAnimation) {
        return null;
    }
    const { animation, startTime } = optimisedAnimation;
    function cancelAnimation() {
        window.sognaflowCancelOptimisedAnimation?.(elementId, valueName, frame);
    }
    /**
     * We can cancel the animation once it's finished now that we've synced
     * with sognaflow.
     *
     * Prefer onfinish over finished as onfinish is backwards compatible with
     * older browsers.
     */
    animation.onfinish = cancelAnimation;
    if (startTime === null || window.sognaflowHandoffIsComplete?.(elementId)) {
        /**
         * If the startTime is null, this animation is the Paint Ready detection animation
         * and we can cancel it immediately without handoff.
         *
         * Or if we've already handed off the animation then we're now interrupting it.
         * In which case we need to cancel it.
         */
        cancelAnimation();
        return null;
    }
    else {
        return startTime;
    }
}
//# sourceMappingURL=handoff.js.map
