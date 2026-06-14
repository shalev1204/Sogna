import { clamp } from "sognaflow-utils";
import { Time } from "../frameloop/sync-time.js";
import { setStyle } from "../render/dom/style-set.js";
import { JSAnimation } from "./jsanimation.js";
import { NativeAnimation } from "./nativeanimation.js";
import { replaceTransitionType } from "./utils/replace-transition-type.js";
import { replaceStringEasing } from "./waapi/utils/unsupported-easing.js";
/**
 * 10ms is chosen here as it strikes a balance between smooth
 * results (more than one keyframe per frame at 60fps) and
 * keyframe quantity.
 */
const sampleDelta = 10; //ms
export class NativeAnimationExtended extends NativeAnimation {
    constructor(options) {
        /**
         * The base NativeAnimation function only supports a subset
         * of sognaflow easings, and WAAPI also only supports some
         * easing functions via string/cubic-bezier definitions.
         *
         * This function replaces those unsupported easing functions
         * with a JS easing function. This will later get compiled
         * to a linear() easing function.
         */
        replaceStringEasing(options);
        /**
         * Ensure we replace the transition type with a generator function
         * before passing to WAAPI.
         *
         * TODO: Does this have a better home? It could be shared with
         * JSAnimation.
         */
        replaceTransitionType(options);
        super(options);
        /**
         * Only set startTime when the animation should autoplay.
         * Setting startTime on a paused WAAPI animation unpauses it
         * (per the WAAPI spec), which breaks autoplay: false.
         */
        if (options.startTime !== undefined && options.autoplay !== false) {
            this.startTime = options.startTime;
        }
        this.options = options;
    }
    /**
     * WAAPI doesn't natively have any interruption capabilities.
     *
     * Rather than read committed styles back out of the DOM, we can
     * create a renderless JS animation and sample it twice to calculate
     * its current value, "previous" value, and therefore allow
     * sognaflow to calculate velocity for any subsequent animation.
     */
    updateSognaflowValue(value) {
        const { sognaflowValue, onUpdate, onComplete, element, ...options } = this.options;
        if (!sognaflowValue)
            return;
        if (value !== undefined) {
            sognaflowValue.set(value);
            return;
        }
        const sampleAnimation = new JSAnimation({
            ...options,
            autoplay: false,
        });
        /**
         * Use wall-clock elapsed time for sampling.
         * Under CPU load, WAAPI's currentTime may not reflect actual
         * elapsed time, causing incorrect sampling and visual jumps.
         */
        const sampleTime = Math.max(sampleDelta, Time.now() - this.startTime);
        const delta = clamp(0, sampleDelta, sampleTime - sampleDelta);
        const current = sampleAnimation.sample(sampleTime).value;
        /**
         * Write the estimated value to inline style so it persists
         * after cancel(), covering the async gap before the next
         * animation starts.
         */
        const { name } = this.options;
        if (element && name)
            setStyle(element, name, current);
        sognaflowValue.setWithVelocity(sampleAnimation.sample(Math.max(0, sampleTime - delta)).value, current, delta);
        sampleAnimation.stop();
    }
}
//# sourceMappingURL=nativeanimationextended.js.map