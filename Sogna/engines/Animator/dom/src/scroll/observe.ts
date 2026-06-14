import { ProgressTimeline } from "../animation/types.js"
import { CancelFrame, Frame } from "../frameloop"

type Update = (progress: number) => void

export function observeTimeline(update: Update, timeline: ProgressTimeline) {
    let prevProgress: number

    const onFrame = () => {
        const { currentTime } = timeline
        const percentage = currentTime === null ? 0 : currentTime.value
        const progress = percentage / 100

        if (prevProgress !== progress) {
            update(progress)
        }

        prevProgress = progress
    }

    Frame.preUpdate(onFrame, true)

    return () => CancelFrame(onFrame)
}
