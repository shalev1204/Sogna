import { Interpolate } from "./interpolate";
export function transform(...args) {
    const useImmediate = !Array.isArray(args[0]);
    const argOffset = useImmediate ? 0 : -1;
    const inputValue = args[0 + argOffset];
    const inputRange = args[1 + argOffset];
    const outputRange = args[2 + argOffset];
    const options = args[3 + argOffset];
    const interpolator = Interpolate(inputRange, outputRange, options);
    return useImmediate ? interpolator(inputValue) : interpolator;
}
//# sourceMappingURL=transform.js.map