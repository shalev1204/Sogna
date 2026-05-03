import { GetMixer } from "./complex";
import { MixNumber as MixNumberImmediate } from "./number";
export function Mix(from, to, p) {
    if (typeof from === "number" &&
        typeof to === "number" &&
        typeof p === "number") {
        return MixNumberImmediate(from, to, p);
    }
    const mixer = GetMixer(from);
    return mixer(from, to);
}
//# sourceMappingURL=index.js.map