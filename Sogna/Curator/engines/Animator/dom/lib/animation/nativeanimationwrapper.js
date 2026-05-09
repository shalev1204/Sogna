import { NativeAnimation } from "./nativeanimation.js";
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
//# sourceMappingURL=nativeanimationwrapper.js.map
