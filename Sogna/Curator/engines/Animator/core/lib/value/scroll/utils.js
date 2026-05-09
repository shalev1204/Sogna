import { sognaflowValue } from "sognaflow-dom";
export function createScrollsognaflowValues() {
    return {
        scrollX: sognaflowValue(0),
        scrollY: sognaflowValue(0),
        scrollXProgress: sognaflowValue(0),
        scrollYProgress: sognaflowValue(0),
    };
}
function setProgress(offset, maxOffset, value) {
    value.set(!offset || !maxOffset ? 0 : offset / maxOffset);
}
export function createScrollUpdater(values, getOffsets) {
    const update = () => {
        const { xOffset, yOffset, xMaxOffset, yMaxOffset } = getOffsets();
        // Set absolute positions
        values.scrollX.set(xOffset);
        values.scrollY.set(yOffset);
        // Set 0-1 progress
        setProgress(xOffset, xMaxOffset, values.scrollXProgress);
        setProgress(yOffset, yMaxOffset, values.scrollYProgress);
    };
    update();
    return update;
}
//# sourceMappingURL=utils.js.map
