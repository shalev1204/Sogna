const animationMaps = new WeakMap();
export const animationMapKey = (name, pseudoElement = "") => `${name}:${pseudoElement}`;
export function getAnimationMap(element) {
    let map = animationMaps.get(element);
    if (!map) {
        map = new Map();
        animationMaps.set(element, map);
    }
    return map;
}
//# sourceMappingURL=active-animations.js.map