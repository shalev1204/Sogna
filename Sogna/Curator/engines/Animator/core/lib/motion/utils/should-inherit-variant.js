export function checkShouldInheritVariant({ animate, variants, inherit, }) {
    return inherit !== undefined ? inherit : !!variants && !animate;
}
//# sourceMappingURL=should-inherit-variant.js.map
