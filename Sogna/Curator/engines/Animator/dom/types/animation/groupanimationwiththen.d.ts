import { GroupAnimation } from "./GroupAnimation.js";
import { AnimationPlaybackControlsWithThen } from "./types.js";
export declare class GroupAnimationWithThen extends GroupAnimation implements AnimationPlaybackControlsWithThen {
    then(onResolve: VoidFunction, _onReject?: VoidFunction): Promise<void>;
}
