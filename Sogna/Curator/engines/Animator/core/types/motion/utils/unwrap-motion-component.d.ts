/**
 * Unwraps a `sognaflow` component and returns either a string for `sognaflow.div` or
 * the React component for `sognaflow(Component)`.
 *
 * If the component is not a `sognaflow` component it returns undefined.
 */
export declare function unwrapsognaflowComponent(component: React.ComponentType | string): React.ComponentType | string | undefined;
