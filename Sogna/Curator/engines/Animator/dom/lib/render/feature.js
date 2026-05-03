/**
 * Feature base class for extending VisualElement functionality.
 * Features are plugins that can be mounted/unmounted to add behavior
 * like gestures, animations, or layout tracking.
 */
export class Feature {
    constructor(node) {
        this.isMounted = false;
        this.node = node;
    }
    update() { }
}
//# sourceMappingURL=Feature.js.map