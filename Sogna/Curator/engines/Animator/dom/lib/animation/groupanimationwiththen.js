import { GroupAnimation } from "./groupanimation.js";
export class GroupAnimationWithThen extends GroupAnimation {
    then(onResolve, _onReject) {
        return this.finished.finally(onResolve).then(() => { });
    }
}
//# sourceMappingURL=groupanimationwiththen.js.map
