import { sognaflowValue } from "sognaflow-dom"

/**
 * @public
 */
export interface ScrollsognaflowValues {
    scrollX: sognaflowValue<number>
    scrollY: sognaflowValue<number>
    scrollXProgress: sognaflowValue<number>
    scrollYProgress: sognaflowValue<number>
}

export interface ScrollOffsets {
    xOffset: number
    yOffset: number
    xMaxOffset: number
    yMaxOffset: number
}

export type GetScrollOffsets = () => ScrollOffsets

export function createScrollsognaflowValues(): ScrollsognaflowValues {
    return {
        scrollX: sognaflowValue(0),
        scrollY: sognaflowValue(0),
        scrollXProgress: sognaflowValue(0),
        scrollYProgress: sognaflowValue(0),
    }
}

function setProgress(offset: number, maxOffset: number, value: sognaflowValue) {
    value.set(!offset || !maxOffset ? 0 : offset / maxOffset)
}

export function createScrollUpdater(
    values: ScrollsognaflowValues,
    getOffsets: GetScrollOffsets
) {
    const update = () => {
        const { xOffset, yOffset, xMaxOffset, yMaxOffset } = getOffsets()
        // Set absolute positions
        values.scrollX.set(xOffset)
        values.scrollY.set(yOffset)
        // Set 0-1 progress
        setProgress(xOffset, xMaxOffset, values.scrollXProgress)
        setProgress(yOffset, yMaxOffset, values.scrollYProgress)
    }

    update()

    return update
}
