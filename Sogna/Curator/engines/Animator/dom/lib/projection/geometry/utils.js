import { calcLength } from "./delta-calc";
function isAxisDeltaZero(delta) {
    return delta.translate === 0 && delta.scale === 1;
}
export function isDeltaZero(delta) {
    return isAxisDeltaZero(delta.x) && isAxisDeltaZero(delta.y);
}
export function axisEquals(a, b) {
    return a.min === b.min && a.max === b.max;
}
export function boxEquals(a, b) {
    return axisEquals(a.x, b.x) && axisEquals(a.y, b.y);
}
export function axisEqualsRounded(a, b) {
    return (Math.round(a.min) === Math.round(b.min) &&
        Math.round(a.max) === Math.round(b.max));
}
export function boxEqualsRounded(a, b) {
    return axisEqualsRounded(a.x, b.x) && axisEqualsRounded(a.y, b.y);
}
export function aspectRatio(box) {
    return calcLength(box.x) / calcLength(box.y);
}
export function axisDeltaEquals(a, b) {
    return (a.translate === b.translate &&
        a.scale === b.scale &&
        a.originPoint === b.originPoint);
}
//# sourceMappingURL=utils.js.map