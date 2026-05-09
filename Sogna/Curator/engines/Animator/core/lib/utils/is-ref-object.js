export function isRefObject(ref) {
    return (ref &&
        typeof ref === "object" &&
        Object.prototype.hasOwnProperty.call(ref, "current"));
}
//# sourceMappingURL=is-ref-object.js.map
