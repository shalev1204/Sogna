type SognaflowStyleLike = Record<string, any>;
/**
 * Updates sognaflow values from props changes.
 * Uses `any` type for element to avoid circular dependencies with VisualElement.
 */
export declare function UpdateSognaflowValuesFromProps(element: any, next: SognaflowStyleLike, prev: SognaflowStyleLike): SognaflowStyleLike;
export {};
