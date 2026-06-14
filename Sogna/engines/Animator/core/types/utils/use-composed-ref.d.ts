/**
 * Taken from https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/compose-refs.tsx
 */
import * as React from "react";
type PossibleRef<T> = React.Ref<T> | undefined;
/**
 * A custom hook that composes multiple refs
 * Accepts callback refs and RefObject(s)
 */
declare function useComposedRefs<T>(...refs: PossibleRef<T>[]): React.RefCallback<T>;
export { useComposedRefs };
