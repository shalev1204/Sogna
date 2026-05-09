import { Frame } from "../../frameloop";
import { FillWildcards } from "./utils/fill-wildcards.js";
import { RemoveNonTranslationalTransform } from "./utils/unit-conversion.js";
const toResolve = new Set();
let isScheduled = false;
let anyNeedsMeasurement = false;
let isForced = false;
function measureAllKeyframes() {
    if (anyNeedsMeasurement) {
        const resolversToMeasure = Array.from(toResolve).filter((resolver) => resolver.needsMeasurement);
        const elementsToMeasure = new Set(resolversToMeasure.map((resolver) => resolver.element));
        const transformsToRestore = new Map();
        /**
         * Write pass
         * If we're measuring elements we want to remove bounding box-changing transforms.
         */
        elementsToMeasure.forEach((element) => {
            const removedTransforms = RemoveNonTranslationalTransform(element);
            if (!removedTransforms.length)
                return;
            transformsToRestore.set(element, removedTransforms);
            element.render();
        });
        // Read
        resolversToMeasure.forEach((resolver) => resolver.measureInitialState());
        // Write
        elementsToMeasure.forEach((element) => {
            element.render();
            const restore = transformsToRestore.get(element);
            if (restore) {
                restore.forEach(([key, value]) => {
                    element.getValue(key)?.set(value);
                });
            }
        });
        // Read
        resolversToMeasure.forEach((resolver) => resolver.measureEndState());
        // Write
        resolversToMeasure.forEach((resolver) => {
            if (resolver.suspendedScrollY !== undefined) {
                window.scrollTo(0, resolver.suspendedScrollY);
            }
        });
    }
    anyNeedsMeasurement = false;
    isScheduled = false;
    toResolve.forEach((resolver) => resolver.complete(isForced));
    toResolve.clear();
}
function readAllKeyframes() {
    toResolve.forEach((resolver) => {
        resolver.readKeyframes();
        if (resolver.needsMeasurement) {
            anyNeedsMeasurement = true;
        }
    });
}
export function flushKeyframeResolvers() {
    isForced = true;
    readAllKeyframes();
    measureAllKeyframes();
    isForced = false;
}
export class KeyframeResolver {
constructor(unresolvedKeyframes, onComplete, name, sognaflowValue, element, isAsync = false) {
        this.state = "pending";
        /**
         * Track whether this resolver is async. If it is, it'll be added to the
         * resolver queue and flushed in the next frame. Resolvers that aren't going
         * to trigger read/write thrashing don't need to be async.
         */
        this.isAsync = false;
        /**
         * Track whether this resolver needs to perform a measurement
         * to resolve its keyframes.
         */
        this.needsMeasurement = false;
        this.unresolvedKeyframes = [...unresolvedKeyframes];
        this.onComplete = onComplete;
this.name = name;
        this.sognaflowValue = sognaflowValue;
        this.element = element;
        this.isAsync = isAsync;
    }
    scheduleResolve() {
        this.state = "scheduled";
        if (this.isAsync) {
            toResolve.add(this);
            if (!isScheduled) {
                isScheduled = true;
                Frame.read(readAllKeyframes);
                Frame.resolveKeyframes(measureAllKeyframes);
            }
        }
        else {
            this.readKeyframes();
            this.complete();
        }
    }
    readKeyframes() {
const { unresolvedKeyframes, name, element, sognaflowValue } = this;
        // If initial keyframe is null we need to read it from the DOM
        if (unresolvedKeyframes[0] === null) {
            const currentValue = sognaflowValue?.get();
            // TODO: This doesn't work if the final keyframe is a wildcard
            const finalKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
            if (currentValue !== undefined) {
                unresolvedKeyframes[0] = currentValue;
            }
else if (element && name) {
const valueAsRead = element.readValue(name, finalKeyframe);
                if (valueAsRead !== undefined && valueAsRead !== null) {
                    unresolvedKeyframes[0] = valueAsRead;
                }
            }
            if (unresolvedKeyframes[0] === undefined) {
                unresolvedKeyframes[0] = finalKeyframe;
            }
            if (sognaflowValue && currentValue === undefined) {
                sognaflowValue.set(unresolvedKeyframes[0]);
            }
        }
        FillWildcards(unresolvedKeyframes);
    }
    setFinalKeyframe() { }
    measureInitialState() { }
    renderEndStyles() { }
    measureEndState() { }
    complete(isForcedComplete = false) {
        this.state = "complete";
        this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, isForcedComplete);
        toResolve.delete(this);
    }
    cancel() {
        if (this.state === "scheduled") {
            toResolve.delete(this);
            this.state = "pending";
        }
    }
    resume() {
        if (this.state === "pending")
            this.scheduleResolve();
    }
}
//# sourceMappingURL=keyframesresolver.js.map
