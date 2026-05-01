import type { Batcher } from "../../frameloop/types"
import type { sognaflowValue } from "../../value"
import { optimizedAppearDataAttribute } from "./data-id"

/**
 * Expose only the needed part of the VisualElement interface to
 * ensure React types don't end up in the generic DOM bundle.
 */
export interface WithAppearProps {
    props: {
        [optimizedAppearDataAttribute]?: string
        values?: {
            [key: string]: sognaflowValue<number> | sognaflowValue<string>
        }
    }
}

export type HandoffFunction = (
    storeId: string,
    valueName: string,
    frame: Batcher
) => number | null

/**
 * The window global object acts as a bridge between our inline script
 * triggering the optimized appear animations, and sognaflow.
 */
declare global {
    interface Window {
        sognaflowHandoffAnimation?: HandoffFunction
        sognaflowHandoffMarkAsComplete?: (elementId: string) => void
        sognaflowHandoffIsComplete?: (elementId: string) => boolean
        sognaflowHasOptimisedAnimation?: (
            elementId?: string,
            valueName?: string
        ) => boolean
        sognaflowCancelOptimisedAnimation?: (
            elementId?: string,
            valueName?: string,
            frame?: Batcher,
            canResume?: boolean
        ) => void
        sognaflowCheckAppearSync?: (
            visualElement: WithAppearProps,
            valueName: string,
            value: sognaflowValue
        ) => VoidFunction | void
        sognaflowIsMounted?: boolean
    }
}
