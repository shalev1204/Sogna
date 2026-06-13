export const createAxisDelta = () => ({
    translate: 0,
    scale: 1,
    origin: 0,
    originPoint: 0,
});
export const createDelta = () => ({
    x: createAxisDelta(),
    y: createAxisDelta(),
});
export const createAxis = () => ({ min: 0, max: 0 });
export const createBox = () => ({
    x: createAxis(),
    y: createAxis(),
});
//# sourceMappingURL=models.js.map