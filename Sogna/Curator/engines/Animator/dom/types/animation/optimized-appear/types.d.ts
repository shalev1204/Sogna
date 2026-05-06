import type { Batcher } from "../../frameloop/types.js";
import type { SognaflowValue } from "../../value";
import { OptimizedAppearDataAttribute } from "./data-id.js";
/**
 * Expose only the needed part of the VisualElement interface to
 * ensure React types don't end up in the generic DOM bundle.
 */
export interface WithAppearProps {
    props: {
        [OptimizedAppearDataAttribute]?: string;
        values?: {
            [key: string]: SognaflowValue<number> | SognaflowValue<string>;
        };
    };
}
export type HandoffFunction = (storeId: string, valueName: string, frame: Batcher) => number | null;
/**
 * The window global object acts as a bridge between our inline script
 * triggering the optimized appear animations, and sognaflow.
 */
declare global {
    interface Window {
        sognaflowHandoffAnimation?: HandoffFunction;
        sognaflowHandoffMarkAsComplete?: (elementId: string) => void;
        sognaflowHandoffIsComplete?: (elementId: string) => boolean;
        sognaflowHasOptimisedAnimation?: (elementId?: string, valueName?: string) => boolean;
        sognaflowCancelOptimisedAnimation?: (elementId?: string, valueName?: string, frame?: Batcher, canResume?: boolean) => void;
        sognaflowCheckAppearSync?: (visualElement: WithAppearProps, valueName: string, value: SognaflowValue) => VoidFunction | void;
        sognaflowIsMounted?: boolean;
    }
}
