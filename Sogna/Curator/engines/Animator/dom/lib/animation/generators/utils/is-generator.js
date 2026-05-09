export function isGenerator(type) {
    return typeof type === "function" && "applyToOptions" in type;
}
//# sourceMappingURL=is-generator.js.map
