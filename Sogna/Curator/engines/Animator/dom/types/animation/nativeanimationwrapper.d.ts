import { NativeAnimation } from "./nativeanimation";
import { AnyResolvedKeyframe } from "./types";
export declare class NativeAnimationWrapper<T extends AnyResolvedKeyframe> extends NativeAnimation<T> {
    constructor(animation: Animation);
}
