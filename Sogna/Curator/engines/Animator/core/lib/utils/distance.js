export const distance = (a, b) => Math.abs(a - b);
export function distance2D(a, b) {
    // Multi-dimensional
    const xDelta = distance(a.x, b.x);
    const yDelta = distance(a.y, b.y);
    return Math.sqrt(xDelta ** 2 + yDelta ** 2);
}
//# sourceMappingURL=distance.js.map
