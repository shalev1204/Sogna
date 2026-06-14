import type { Transition, IProjectionNode } from "sognaflow-dom";
export interface SwitchLayoutGroup {
    register?: (member: IProjectionNode) => void;
    deregister?: (member: IProjectionNode) => void;
}
export type SwitchLayoutGroupContext = SwitchLayoutGroup & InitialProsognaflowConfig;
export type InitialProsognaflowConfig = {
    /**
     * The initial transition to use when the elements in this group mount (and automatically promoted).
     * Subsequent updates should provide a transition in the promote method.
     */
    transition?: Transition;
    /**
     * If the follow tree should preserve its opacity when the lead is promoted on mount
     */
    shouldPreserveFollowOpacity?: (member: IProjectionNode) => boolean;
};
/**
 * Internal, exported only for usage in Framer
 */
export declare const SwitchLayoutGroupContext: import("react").Context<SwitchLayoutGroupContext>;
