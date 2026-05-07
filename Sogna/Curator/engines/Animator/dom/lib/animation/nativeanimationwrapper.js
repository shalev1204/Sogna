import { NativeAnimation } from "./NativeAnimation.js";
export class NativeAnimationWrapper extends NativeAnimation {
    constructor(animation) {
        super();
        this.animation = animation;
        animation.onfinish = () => {
            this.finishedTime = this.time;
            this.notifyFinished();
        };
    }
}
//# sourceMappingURL=NativeAnimationWrapper.js.map