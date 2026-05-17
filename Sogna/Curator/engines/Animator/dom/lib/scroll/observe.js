import { CancelFrame, Frame } from "../frameloop";
export function observeTimeline(update, timeline) {
    let prevProgress;
    const onFrame = () => {
        const { currentTime } = timeline;
        const percentage = currentTime === null ? 0 : currentTime.value;
        const progress = percentage / 100;
        if (prevProgress !== progress) {
            update(progress);
        }
        prevProgress = progress;
    };
    Frame.preUpdate(onFrame, true);
    return () => CancelFrame(onFrame);
}
//# sourceMappingURL=observe.js.map