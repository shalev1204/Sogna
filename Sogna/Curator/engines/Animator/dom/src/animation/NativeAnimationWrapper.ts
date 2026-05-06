import { NativeAnimation } from "./NativeAnimation.js"
import { AnyResolvedKeyframe } from "./types.js"

export class NativeAnimationWrapper<
    T extends AnyResolvedKeyframe
> extends NativeAnimation<T> {
    constructor(animation: Animation) {
        super()

        this.animation = animation
        animation.onfinish = () => {
            this.finishedTime = this.time
            this.notifyFinished()
        }
    }
}
