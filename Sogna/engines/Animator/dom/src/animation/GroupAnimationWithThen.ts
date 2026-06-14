import { GroupAnimation } from "./groupanimation.js"
import { AnimationPlaybackControlsWithThen } from "./types.js"

export class GroupAnimationWithThen
    extends GroupAnimation
    implements AnimationPlaybackControlsWithThen
{
    then(onResolve: VoidFunction, _onReject?: VoidFunction) {
        return this.finished.finally(onResolve).then(() => {})
    }
}
