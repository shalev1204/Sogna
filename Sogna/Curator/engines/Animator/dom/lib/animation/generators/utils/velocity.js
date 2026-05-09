import { velocityPerSecond } from "sognaflow-utils";
const velocitySampleDuration = 5; // ms
export function getGeneratorVelocity(resolveValue, t, current) {
    const prevT = Math.max(t - velocitySampleDuration, 0);
    return velocityPerSecond(current - resolveValue(prevT), t - prevT);
}
//# sourceMappingURL=velocity.js.map
