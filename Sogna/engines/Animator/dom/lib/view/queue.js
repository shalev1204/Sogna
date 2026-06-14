import { removeItem } from "sognaflow-utils";
import { Microtask } from "../frameloop/microtask.js";
import { StartViewAnimation } from "./start.js";
let builders = [];
let current = null;
function next() {
    current = null;
    const [nextBuilder] = builders;
    if (nextBuilder)
        start(nextBuilder);
}
function start(builder) {
    removeItem(builders, builder);
    current = builder;
    StartViewAnimation(builder).then((animation) => {
        builder.notifyReady(animation);
        animation.finished.finally(next);
    });
}
function processQueue() {
    /**
     * Iterate backwards over the builders array. We can ignore the
     * "wait" animations. If we have an interrupting animation in the
     * queue then we need to batch all preceeding animations into it.
     * Currently this only batches the update functions but will also
     * need to batch the targets.
     */
    for (let i = builders.length - 1; i >= 0; i--) {
        const builder = builders[i];
        const { interrupt } = builder.options;
        if (interrupt === "immediate") {
            const batchedUpdates = builders.slice(0, i + 1).map((b) => b.update);
            const remaining = builders.slice(i + 1);
            builder.update = () => {
                batchedUpdates.forEach((update) => update());
            };
            // Put the current builder at the front, followed by any "wait" builders
            builders = [builder, ...remaining];
            break;
        }
    }
    if (!current || builders[0]?.options.interrupt === "immediate") {
        next();
    }
}
export function AddToQueue(builder) {
    builders.push(builder);
    Microtask.render(processQueue);
}
//# sourceMappingURL=queue.js.map