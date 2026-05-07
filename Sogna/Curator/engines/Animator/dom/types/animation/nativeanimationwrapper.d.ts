import { NativeAnimation } from "./NativeAnimation.js";
import { AnyResolvedKeyframe } from "./types.js";
export declare class NativeAnimationWrapper<T extends AnyResolvedKeyframe> extends NativeAnimation<T> {
    constructor(animation: Animation);
}
