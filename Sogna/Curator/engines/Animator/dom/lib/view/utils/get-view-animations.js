function FilterViewAnimations(animation) {
    const { effect } = animation;
    if (!effect)
        return false;
    return (effect.target === document.documentElement &&
        effect.pseudoElement?.startsWith("::view-transition"));
}
export function GetViewAnimations() {
    return document.getAnimations().filter(FilterViewAnimations);
}
//# sourceMappingURL=get-view-animations.js.map
