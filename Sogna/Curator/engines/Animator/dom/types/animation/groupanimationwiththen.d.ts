import { GroupAnimation } from "./groupanimation";
import { AnimationPlaybackControlsWithThen } from "./types";
export declare class GroupAnimationWithThen extends GroupAnimation implements AnimationPlaybackControlsWithThen {
    then(onResolve: VoidFunction, _onReject?: VoidFunction): Promise<void>;
}
