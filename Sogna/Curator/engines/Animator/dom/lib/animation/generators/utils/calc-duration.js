/**
 * Implement a practical max duration for keyframe generation
 * to prevent infinite loops
 */
export const maxGeneratorDuration = 20000;
export function calcGeneratorDuration(generator) {
    let duration = 0;
    const timeStep = 50;
    let state = generator.next(duration);
    while (!state.done && duration < maxGeneratorDuration) {
        duration += timeStep;
        state = generator.next(duration);
    }
    return duration >= maxGeneratorDuration ? Infinity : duration;
}
//# sourceMappingURL=calc-duration.js.map