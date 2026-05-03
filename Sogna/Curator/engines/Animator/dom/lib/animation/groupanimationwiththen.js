import { GroupAnimation } from "./groupanimation";
export class GroupAnimationWithThen extends GroupAnimation {
    then(onResolve, _onReject) {
        return this.finished.finally(onResolve).then(() => { });
    }
}
//# sourceMappingURL=GroupAnimationWithThen.js.map